const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?output=csv';

/**
 * Hàm tìm kiếm dữ liệu từ Google Sheets
 */
async function searchData() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const container = document.getElementById('timeline');
    
    if (!keyword) {
        alert("Vui lòng nhập mã lô hoặc tên vật liệu!");
        return;
    }

    // Hiển thị trạng thái đang tải
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Đang truy xuất toàn bộ dữ liệu liên quan...</p>
        </div>`;

    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        
        // Chuyển đổi CSV thành mảng (xử lý cả trường hợp dữ liệu có dấu phẩy bên trong ngoặc kép)
        const rows = data.split(/\r?\n/).map(row => 
            row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        );

        // Lọc TẤT CẢ các dòng khớp với từ khóa (Số lô thường sẽ khớp nhiều dòng nguyên liệu)
        const allMatches = rows.filter((col, index) => {
            if (index === 0) return false; // Bỏ qua tiêu đề
            return col.some(cell => cell.toLowerCase().includes(keyword));
        });

        if (allMatches.length > 0) {
            renderMultiTimeline(allMatches);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search-minus"></i>
                    <p>Không tìm thấy dữ liệu nào khớp với từ khóa: <b>${keyword}</b></p>
                </div>`;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="empty-state">Lỗi kết nối dữ liệu. Vui lòng kiểm tra lại đường dẫn Sheet.</div>';
    }
}

/**
 * Hàm hiển thị giao diện Gộp nhiều dòng dữ liệu
 */
function renderMultiTimeline(matches) {
    const container = document.getElementById('timeline');
    container.innerHTML = ''; 

    // Lấy thông tin chung từ dòng đầu tiên tìm được (Dành cho thông tin Sản xuất & Kho)
    const firstMatch = matches[0].map(c => c.replace(/"/g, '').trim());

    // 1. Xử lý danh sách NGUYÊN LIỆU (Duyệt qua tất cả dòng tìm được)
    let nvlHtml = '';
    matches.forEach(row => {
        const col = row.map(c => c.replace(/"/g, '').trim());
        // Chỉ thêm vào danh sách nếu có tên vật liệu (cột index 1)
        if (col[1]) {
            nvlHtml += `
                <div class="material-item">
                    <i class="fas fa-check-circle"></i>
                    <div class="mat-info">
                        <span class="mat-name">${col[1]}</span>
                        <span class="mat-detail">${col[3]} ${col[4]} — NCC: ${col[2]}</span>
                    </div>
                </div>`;
        }
    });

    // 2. Render giao diện tổng thể theo 3 giai đoạn
    container.innerHTML = `
        <div class="step-card">
            <div class="step-header">
                <i class="fas fa-shopping-cart"></i> Giai đoạn 1: Thu mua Vật tư
            </div>
            <p style="font-size: 13px; color: #666; margin-bottom: 10px;">Danh sách nguyên liệu cấu thành:</p>
            <div class="materials-list">
                ${nvlHtml}
            </div>
            <div class="info-grid" style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                 <div class="info-item"><b>Ngày nhập sớm nhất</b><span>${firstMatch[0]}</span></div>
                 <div class="info-item"><b>Mục đích sử dụng</b><span>${firstMatch[5]}</span></div>
            </div>
        </div>

        <div class="step-card">
            <div class="step-header">
                <i class="fas fa-industry"></i> Giai đoạn 2: Sản xuất & Chế biến
            </div>
            <div class="info-grid">
                <div class="info-item"><b>Công thức</b><span>${firstMatch[6]}</span></div>
                <div class="info-item"><b>Thiết bị/Máy</b><span>${firstMatch[8]}</span></div>
                <div class="info-item"><b>Sản lượng dự kiến</b><span>${firstMatch[7]}</span></div>
                <div class="info-item"><b>Thời gian vận hành</b><span>${firstMatch[11]} ${firstMatch[10]} <i class="fas fa-long-arrow-alt-right"></i> ${firstMatch[13]} ${firstMatch[12]}</span></div>
            </div>
        </div>

        <div class="step-card">
            <div class="step-header">
                <i class="fas fa-warehouse"></i> Giai đoạn 3: Thành phẩm & Xuất kho
            </div>
            <div class="info-grid">
                <div class="info-item"><b>Số Lô (Batch No.)</b><span class="highlight-text">${firstMatch[14]}</span></div>
                <div class="info-item"><b>Tổng nhập kho</b><span>${firstMatch[15]}</span></div>
                <div class="info-item"><b>Hạn sử dụng</b><span>${firstMatch[16]}</span></div>
                <div class="info-item"><b>Khách hàng</b><span>${firstMatch[17]}</span></div>
            </div>
        </div>
    `;
}
