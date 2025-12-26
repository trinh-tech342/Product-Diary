const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?output=csv';

async function searchData() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const timelineContainer = document.getElementById('timeline');
    
    if (!keyword) {
        alert("Vui lòng nhập từ khóa tìm kiếm!");
        return;
    }

    timelineContainer.innerHTML = '<p class="loading">Đang tra cứu...</p>';

    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        const rows = data.split(/\r?\n/).map(row => 
            row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        );

        // Tìm hàng có chứa từ khóa (kiểm tra ở tất cả các cột)
        const foundRow = rows.find((col, index) => {
            if (index === 0) return false; // Bỏ qua tiêu đề
            return col.some(cell => cell.toLowerCase().includes(keyword));
        });

        if (foundRow) {
            const col = foundRow.map(c => c.replace(/"/g, '').trim());
            renderTimeline(col);
        } else {
            timelineContainer.innerHTML = '<p class="loading">Không tìm thấy kết quả nào khớp với từ khóa.</p>';
        }

    } catch (error) {
        timelineContainer.innerHTML = "Lỗi kết nối dữ liệu.";
    }
}

function renderTimeline(col) {
    const container = document.getElementById('timeline');
    container.innerHTML = ''; // Xóa thông báo cũ

    // Cấu trúc hiển thị 3 khối theo thứ tự bạn đã cung cấp
    const stages = [
        {
            title: "Thu mua",
            data: { "Ngày": col[0], "Vật liệu": col[1], "Nhà CC": col[2], "Số lượng": col[3], "Đơn vị": col[4], "Mục đích": col[5] }
        },
        {
            title: "Sản xuất",
            data: { "Công thức": col[6], "Số lượng": col[7], "Máy": col[8], "Thành phần": col[9], "Bắt đầu": `${col[11]} ${col[10]}`, "Kết thúc": `${col[13]} ${col[12]}` }
        },
        {
            title: "Kho",
            data: { "Số Lô": col[14], "Số lượng": col[15], "HSD": col[16], "Khách hàng": col[17] }
        }
    ];

    stages.forEach(stage => {
        let detailHtml = '';
        for (const [key, value] of Object.entries(stage.data)) {
            if (value && value !== "undefined" && value !== "") {
                detailHtml += `<div class="info-item"><b>${key}:</b> ${value}</div>`;
            }
        }
        
        container.innerHTML += `
            <div class="step-card">
                <div class="step-header">${stage.title}</div>
                <div class="info-grid">${detailHtml}</div>
            </div>
        `;
    });
}
