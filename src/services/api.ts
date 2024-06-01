import axios from 'axios'; // 引入 axios 库
import Crawler from './crawler'; // 假设Crawler类位于相同的目录下
import { OrganizationData, StageData } from './types'; // 引入组织数据和阶段数据的类型定义

//fetchCombinedData
export const fetchCombinedData = async (username: string, password: string) => {
  try {
    // 创建Crawler实例
    const crawler = new Crawler(username, password);

    // 登录
    const isLoggedIn = await crawler.login();
    if (!isLoggedIn) {
      console.log('登录失败');
      return { organizationData: [], stageData: [] } as { organizationData: OrganizationData[], stageData: StageData[] };
    }

    // 获取组织数据
    await crawler.getOrganizationsData();
    const organizationData = crawler.orginazationsData;

    // 获取阶段数据
    await crawler.getStagesData();
    const stageData = crawler.stagesData;

    // 返回合并后的数据
    return { organizationData, stageData };
  } catch (error) {
    console.error('Error fetching combined data:', error); // 输出捕获到的错误信息
    return { organizationData: [], stageData: [] } as { organizationData: OrganizationData[], stageData: StageData[] };
  }
};

//fetchOrganizationData
export const fetchOrganizationData = async (username: string, password: string): Promise<OrganizationData[]> => {
  try {
    // 创建Crawler实例
    const crawler = new Crawler(username, password);

    // 登录
    const isLoggedIn = await crawler.login();
    await crawler.getOrganizationsData();
    if (!isLoggedIn) {
      console.log('登录失败');
      return [];
    }

    // 返回组织数据
    return crawler.orginazationsData;
  } catch (error) {
    console.error('Error fetching organization data:', error); // 输出捕获到的错误信息
    return [];
  }
};

//fetchStageData
export const fetchStageData = async (username: string, password: string): Promise<StageData[]> => {
  try {
    // 创建Crawler实例
    const crawler = new Crawler(username, password);

    // 登录
    const isLoggedIn = await crawler.login();
    await crawler.getStagesData();
    if (!isLoggedIn) {
      console.log('登录失败');
      return [];
    }

    // 返回阶段数据
    return crawler.stagesData;
  } catch (error) {
    console.error('Error fetching stage data:', error); // 输出捕获到的错误信息
    return [];
  }
};

// fetchCompleteLists
export const fetchCompleteLists = async (username: string, password: string, sid: number, orgids: number[]): Promise<File[] | null> => {
  try {
    // 创建Crawler实例
    const crawler = new Crawler(username, password);

    // 登录
    const isLoggedIn = await crawler.login();
    await crawler.getOrganizationsData();
    await crawler.getStagesData();
    
    if (!isLoggedIn) {
      console.log('登录失败');
      return null;
    }

    // 获取所有下载链接
    const allDownloadUrls: string[] = [];
    for (const orgid of orgids) {
      const downloadUrl = await crawler.getExcelDownloadLink(orgid, sid);
      allDownloadUrls.push(downloadUrl);
    }
    console.log('All download URLs:', allDownloadUrls);
    // 实现下载
    const files: File[] = [];
    for (const [index, downloadUrl] of allDownloadUrls.entries()) {
      const response = await axios.get(downloadUrl, {
        responseType: 'blob', // 以二进制形式获取响应
      });

      const fileName = `organization_${orgids[index]}-stage_${sid}.xlsx`; // 使用组织ID作为文件名

      // 创建 Blob 对象
      const blob = new Blob([response.data], { type: response.headers['content-type'] });

      // 创建文件对象
      const file = new File([blob], fileName, { type: response.headers['content-type'] });

      files.push(file);
    }
    console.log('Downloaded files:', files);
    // 返回下载的文件对象数组
    return files;
  } catch (error) {
    console.error('Error fetching complete lists:', error); // 输出捕获到的错误信息
    return null;
  }
};
