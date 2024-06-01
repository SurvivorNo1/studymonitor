import * as XLSX from 'xlsx';

export const compareExcels = async (totalListFile: File, completeLists: File[]): Promise<any[]> => {
  const totalListData = await readExcel(totalListFile);
  const allCompleteRecords = await Promise.all(completeLists.map(readExcel));
  
  // 创建一个匹配的记录集合
  const allCompleteRecordsFlat = allCompleteRecords.flat();

  const matchedRecords = totalListData.map(totalRecord => {
    // 提取主键
    const { 姓名: totalName, 组织名称: totalOrg } = totalRecord;

    // 查找匹配记录
    const matchingRecord = allCompleteRecordsFlat.find(completeRecord => {
      const { 姓名: completeName, 选择组织: completeOrg } = completeRecord;
      return totalName === completeName && totalOrg === completeOrg;
    });

    // 如果找到匹配记录，则合并学习时间，否则填充“未学习”
    if (matchingRecord) {
      return {
        ...totalRecord,
        学习时间: matchingRecord.学习时间 || '未学习',
      };
    } else {
      return {
        ...totalRecord,
        学习时间: '未学习',
      };
    }
  });

  return matchedRecords;
};


const readExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      //不支持多个工作表
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      resolve(jsonData);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
