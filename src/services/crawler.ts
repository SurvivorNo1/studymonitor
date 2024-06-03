import axios, { AxiosInstance } from 'axios';
import { AxiosResponse } from 'axios';
import { StageData, OrganizationData } from './types';

class Crawler {
    private username: string;
    private password: string;
    private baseURL: string;
    private headers: { [key: string]: string };
    private loginUrl: string;
    private stagesListUrl: string;
    private organizeListUrl: string;
    public stagesData: StageData[];
    public orginazationsData: OrganizationData[];
    public latestStageId: number;
    private orgId: number;
    public orgName: string;
    private session: AxiosInstance;
    private debug: boolean;
    private loginState: boolean;
    public token: string | null;

    constructor(username: string, password: string, debug: boolean = false) {
        this.username = username;
        this.password = password;
        this.baseURL = "https://dxx.scyol.com/backend";
        this.headers = {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
        };
        this.loginUrl = `${this.baseURL}/adminUser/login`;
        this.stagesListUrl = `${this.baseURL}/stages/list`;
        this.organizeListUrl = `${this.baseURL}/study/organize/list`;
        this.stagesData = [];
        this.orginazationsData = [];
        this.latestStageId = -1;
        this.orgId = -1;
        this.orgName = '';
        this.session = axios.create({
            baseURL: this.baseURL
        });
        this.debug = debug;
        this.loginState = false;
        this.token = null;
    }

    public async login(): Promise<string | boolean> {
        try {
            const response: AxiosResponse = await this.session.post(this.loginUrl, {
                username: this.username,
                password: this.password
            });
            const responseData = response.data;
            console.log('login response data:', responseData);
            if (responseData.code !== 200) {
                console.log(`登录失败，错误代码 ${responseData.code}。请检查后重试！`);
                return false;
            } else {
                this.headers.token = responseData.data.token;
                this.orgId = responseData.data.orgId;
                this.orgName = responseData.data.username;
                this.token = this.headers.token;
                this.loginState = true;
                sessionStorage.setItem('token', this.token);
                return this.headers.token;
            }
        } catch (error) {
            console.error('登录错误:', error);
            return false;
        }
    }

    public async check(): Promise<boolean> {
        if (this.loginState) {
            return true;
        } else {
            return await this.login() !== false;
        }
    }

    public async getStagesData(): Promise<boolean> {
        if (this.loginState) {
            try {
                const response: AxiosResponse = await this.session.post(this.stagesListUrl, {
                    pageNo: 1,
                    pageSize: 100
                }, {
                    headers: this.headers
                });
                const responseData = response.data;
                console.log('stagesData response data:', responseData);

                this.stagesData = responseData.data.map((stage: any) => ({
                    id: stage.id,
                    snum: stage.snum,
                    created: stage.created,
                    url: stage.url
                }));

                this.latestStageId = this.stagesData[0].id;
                if (this.debug) {
                    console.log('stagesId response data:', responseData);
                }
                return true;
            } catch (error) {
                console.error('获取最新期数的 stageId 错误:', error);
                return false;
            }
        } else {
            console.log('未登录');
            return false;
        }
    }

    public async getOrganizationsData(): Promise<boolean> {
        if (this.loginState) {
            const data = {
                pid: this.orgId,
                orgName: "",
                stagesId: this.latestStageId,
                pageNo: 1,
                pageSize: 100
            };
            try {
                const response: AxiosResponse = await this.session.post(this.organizeListUrl, data, {
                    headers: this.headers
                });
                const responseData = response.data;
                console.log(responseData)
                this.orginazationsData = responseData.data.map((organization: any) => ({
                    orgId: organization.orgId,
                    orgName: organization.orgName,
                }));
                this.orginazationsData.push({orgId:this.orgId, orgName:this.orgName});
                return true;
            } catch (error) {
                console.error('获取机构数据错误:', error);
                return false;
            }
        } else {
            console.log('未登录');
            return false;
        }
    }

    public async getExcelDownloadLink(orgId?: number, stagesId?: number): Promise<string | null> {
        if (!this.loginState) {
            console.log('未登录');
            return null;
        }

        let downloadUrl = 'https://dxx.scyol.com/backend/study/student/excel?';

        // 根据参数情况构建下载链接
        if (orgId !== undefined) {
            downloadUrl += `orgId=${orgId}&`;
        }
        if (stagesId !== undefined) {
            downloadUrl += `stagesId=${stagesId}&`;
        }
        downloadUrl += `name=&tel=&token=${this.token}`;

        return downloadUrl;
    }
}

export default Crawler;
