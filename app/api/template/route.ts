import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Forecast Accuracy");

  // Tambahkan numFmt pada kolom yang bersifat angka
  worksheet.columns = [
    { header: "year", key: "year", width: 10, style: { numFmt: '0' } },
    { header: "month", key: "month", width: 10, style: { numFmt: '0' } },
    { header: "week", key: "week", width: 10, style: { numFmt: '0' } },
    { header: "plant", key: "plant", width: 15 },
    { header: "business_unit", key: "business_unit", width: 20 },
    { header: "category", key: "category", width: 15 },
    { header: "code", key: "code", width: 25 },
    { header: "forecast", key: "forecast", width: 20, style: { numFmt: '#,##0' } },
    { header: "produksi", key: "produksi", width: 20, style: { numFmt: '#,##0' } },
    { header: "sales", key: "sales", width: 20, style: { numFmt: '#,##0' } },
  ];

  const headerRow = worksheet.getRow(1);

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF8C00' }, 
    };

    cell.font = {
      bold: true,
      color: { argb: 'FF000000' },
      size: 11
    };

    const borderColor = { argb: 'FFE1EBFC' }; 

    cell.border = {
      top: { style: 'thin', color: borderColor },
      left: { style: 'thin', color: borderColor },
      bottom: { style: 'thin', color: borderColor },
      right: { style: 'thin', color: borderColor }
    };

    cell.alignment = { 
      vertical: 'middle', 
      horizontal: 'left', 
    };
  });

  headerRow.height = 20;

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=Forecast_Accuracy-[Plant]_[Year][Month][Week].xlsx",
    },
  });
}