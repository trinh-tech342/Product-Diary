// Đường dẫn CSV từ Google Sheets của bạn
const URL_THU_MUA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?gid=0&output=csv';
const URL_SAN_XUAT = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?gid=457318854&output=csv';
const URL_LOT_INFO = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?gid=472003237&output=csv';

async function fetchCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        const data = await response.text();
        // Tách dòng và tách cột, lọc bỏ dòng trống
        return data.split(/\r?\n/)
            .filter(row => row.trim() !== '')
            .map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map(cell => cell.replace(/"/g, '').trim()));
    } catch (err) {
        console.error("Lỗi Fetch:", err);
        return [];
    }
}

async function searchData() {
    const keyword = document.getElementById('searchInput').value.trim().toUpperCase();
    const container = document.getElementById('timeline');
    
    if (!keyword) {
        alert("Vui lòng nhập Số Lô (Batch No) để tra cứu!");
        return;
    }

    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Đang quét dữ liệu hệ thống...</p></div>';

    try {
        const [rowsThuMua, rowsSanXuat, rowsLotInfo] = await Promise.all([
            fetchCSV(URL_THU_MUA),
            fetchCSV(URL_SAN_XUAT),
            fetchCSV(URL_LOT_INFO)
        ]);

        // KHỚP DỮ LIỆU
        // GĐ 3: Tìm trong bảng lot_info (Số lô thường ở cột đầu tiên index 0)
        const lotData = rowsLotInfo.find(row => row[0] === keyword);

        // GĐ 2: Tìm trong bảng san_xuat (Số lô ở cột đầu tiên index 0)
        const prodData = rowsSanXuat.find(row => row[0] === keyword);

        // GĐ 1: Tìm tất cả nguyên liệu trong bảng thu_mua (Số lô sản xuất ở cột cuối index 6)
        const materials = rowsThuMua.filter(row => row[6] === keyword);

        if (!lotData && !prodData && materials.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-search-minus"></i><p>Không tìm thấy dữ liệu cho lô: <b>${keyword}</b></p></div>`;
            return;
        }

        renderTraceability(materials, prodData, lotData);

    } catch (error) {
        container.innerHTML = '<div class="empty-state">Lỗi kết nối. Vui lòng kiểm tra lại quyền truy cập Google Sheet.</div>';
    }
}

function renderTraceability(materials, p, lot) {
    const container = document.getElementById('timeline');
    
    // Tạo danh sách nguyên liệu
    let matHtml = materials.map(m => `
        <div class="material-item">
            <i class="fas fa-check-circle"></i>
            <div class="mat-info">
                <span class="mat-name">${m[1] || 'N/A'} (${m[3] || ''} ${m[4] || ''})</span>
                <span class="mat-detail">Ngày nhập: ${m[0]} | NCC: ${m[2]}</span>
            </div>
        </div>`).join('');

    container.innerHTML = `
        <div class="step-card">
            <div class="step-header"><i class="fas fa-shopping-cart"></i> Giai đoạn 1: Thu mua Vật tư</div>
            <div class="materials-list">${matHtml || 'Không tìm thấy vật tư liên quan'}</div>
        </div>

        <div class="step-card">
            <div class="step-header"><i class="fas fa-industry"></i> Giai đoạn 2: Sản xuất & Chế biến</div>
            <div class="info-grid">
                <div class="info-item"><b>Công thức</b><span>${p ? p[8] : '---'}</span></div>
                <div class="info-item"><b>Thông số (Nhiệt/Máy)</b><span>${p ? p[3] : '---'}</span></div>
                <div class="info-item"><b>Thời gian bắt đầu</b><span>${p ? p[5] + ' ' + p[4] : '---'}</span></div>
                <div class="info-item"><b>Thời gian kết thúc</b><span>${p ? p[7] + ' ' + p[6] : '---'}</span></div>
            </div>
        </div>

        <div class="step-card">
            <div class="step-header"><i class="fas fa-warehouse"></i> Giai đoạn 3: Thành phẩm & Xuất kho</div>
            <div class="info-grid">
                <div class="info-item"><b>Số Lô Niêm Yết</b><span class="highlight">${lot ? lot[0] : '---'}</span></div>
                <div class="info-item"><b>Sản lượng nhập kho</b><span>${lot ? lot[1] : '---'}</span></div>
                <div class="info-item"><b>Hạn sử dụng</b><span>${lot ? lot[2] : '---'}</span></div>
                <div class="info-item"><b>Khách hàng mục tiêu</b><span>${lot ? lot[3] : '---'}</span></div>
            </div>
        </div>
    `;
}
