// Thay link CSV của bạn vào đây
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?output=csv';

async function fetchSheetData() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Bỏ dòng tiêu đề
        
        const timelineContainer = document.getElementById('timeline');
        timelineContainer.innerHTML = ''; // Xóa thông báo loading

        rows.forEach(row => {
            const columns = row.split(',');
            // Giả sử thứ tự cột: Type, Date, Material, Supplier, Qty, Unit, Purpose, Recipe, Machine, Ingredient, StartTime, StartDate, EndTime, EndDate, LotNo, HSD, Customer
            const type = columns[0].trim();
            
            let content = '';

            if (type === "Thu mua") {
                content = createCard("Thu mua", {
                    "Ngày": columns[1], "Vật liệu": columns[2], "Nhà CC": columns[3],
                    "Số lượng": columns[4], "Đơn vị": columns[5], "Mục đích": columns[6]
                });
            } else if (type === "Sản xuất") {
                content = createCard("Sản xuất", {
                    "Công thức": columns[7], "Số lượng": columns[4], "Máy": columns[8],
                    "Thành phần": columns[9], "Bắt đầu": `${columns[11]} ${columns[10]}`,
                    "Kết thúc": `${columns[13]} ${columns[12]}`
                });
            } else if (type === "Kho") {
                content = createCard("Kho", {
                    "Số Lô": columns[14], "Số lượng": columns[4], "HSD": columns[15], "Khách hàng": columns[16]
                });
            }

            if (content) timelineContainer.innerHTML += content;
        });
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        document.getElementById('timeline').innerHTML = "Không thể tải dữ liệu.";
    }
}

function createCard(title, details) {
    let detailHtml = '';
    for (const [key, value] of Object.entries(details)) {
        if (value && value.trim() !== "") {
            detailHtml += `<div class="info-item"><b>${key}:</b> ${value}</div>`;
        }
    }
    
    return `
        <div class="step-card">
            <div class="step-header">${title}</div>
            <div class="info-grid">
                ${detailHtml}
            </div>
        </div>
    `;
}

// Chạy hàm lấy dữ liệu
fetchSheetData();
