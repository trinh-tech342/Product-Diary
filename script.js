// Thay các link dưới đây bằng link CSV tương ứng từ 3 sheet của bạn
const URL_THU_MUA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?gid=0&single=true&output=csv';
const URL_SAN_XUAT = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?gid=457318854&single=true&output=csv';
const URL_LOT_INFO = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsl9LECSCDb82qUb7iIEU67XDtOsIeGBEXytLelidtSZCMgLKqcsRBUp1ZEMGOLccOz3kOB4KT65xq/pub?gid=472003237&single=true&output=csv';
/**
 * Hàm hỗ trợ tải và chuyển đổi CSV sang Array
 */
async function fetchCSV(url) {
    const response = await fetch(url);
    const data = await response.text();
    return data.split(/\r?\n/).map(row => 
        row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/"/g, '').trim())
    );
}

async function searchData() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const container = document.getElementById('timeline');
    
    if (!keyword) {
        alert("Vui lòng nhập số lô sản xuất (VD: C010225)!");
        return;
    }

    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Đang kết nối dữ liệu...</p></div>';

    try {
        // Tải đồng thời dữ liệu từ 3 nguồn
        const [rowsThuMua, rowsSanXuat, rowsLotInfo] = await Promise.all([
            fetchCSV(URL_THU_MUA),
            fetchCSV(URL_SAN_XUAT),
            fetchCSV(URL_LOT_INFO)
        ]);

        // 1. Tìm thông tin Lô hàng (Giai đoạn 3)
        const lotData = rowsLotInfo.find(row => row[0] && row[0].toLowerCase() === keyword);

        // 2. Tìm thông tin Sản xuất (Giai đoạn 2)
        const prodMatches = rowsSanXuat.filter(row => row[0] && row[0].toLowerCase() === keyword);

        // 3. Tìm nguyên liệu thu mua (Giai đoạn 1) - Khớp theo lot_no ở cột cuối (index 6)
        const materialMatches = rowsThuMua.filter(row => row[6] && row[6].toLowerCase() === keyword);

        if (!lotData && prodMatches.length === 0 && materialMatches.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-search-minus"></i><p>Không tìm thấy số lô: <b>${keyword}</b></p></div>`;
            return;
        }

        renderTraceability(materialMatches, prodMatches, lotData);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="empty-state">Lỗi kết nối dữ liệu. Hãy kiểm tra lại link Publish của các Sheet.</div>';
    }
}

function renderTraceability(materials, production, lot) {
    const container = document.getElementById('timeline');
    
    // Xử lý HTML danh sách nguyên liệu 
    let matHtml = materials.map(m => `
        <div class="material-item">
            <i class="fas fa-check-circle"></i>
            <div class="mat-info">
                <span class="mat-name">${m[1]} (Số lượng: ${m[3]} ${m[4]})</span>
                <span class="mat-detail">Ngày nhập: ${m[0]} — NCC: ${m[2]}</span>
            </div>
        </div>`).join('') || '<p>Không có dữ liệu thu mua riêng cho lô này.</p>';

    // Lấy thông tin sản xuất đầu tiên để làm header 
    const p = production[0] || [];

    container.innerHTML = `
        <div class="step-card">
            <div class="step-header"><i class="fas fa-shopping-cart"></i> Giai đoạn 1: Thu mua Vật tư</div>
            <div class="materials-list">${matHtml}</div>
        </div>

        <div class="step-card">
            <div class="step-header"><i class="fas fa-industry"></i> Giai đoạn 2: Sản xuất & Chế biến</div>
            <div class="info-grid">
                <div class="info-item"><b>Công thức</b><span>${p[8] || '---'}</span></div>
                <div class="info-item"><b>Nhiệt độ/Máy</b><span>${p[3] || '---'}</span></div>
                <div class="info-item"><b>Ngày bắt đầu</b><span>${p[5] || '---'} lúc ${p[4] || ''}</span></div>
                <div class="info-item"><b>Ngày kết thúc</b><span>${p[7] || '---'} lúc ${p[6] || ''}</span></div>
            </div>
        </div>

        <div class="step-card">
            <div class="step-header"><i class="fas fa-warehouse"></i> Giai đoạn 3: Thành phẩm & Xuất kho</div>
            <div class="info-grid">
                <div class="info-item"><b>Số Lô (Batch No.)</b><span class="highlight-text">${lot ? lot[0] : '---'}</span></div>
                <div class="info-item"><b>Tổng sản lượng</b><span>${lot ? lot[1] : '---'}</span></div>
                <div class="info-item"><b>Hạn sử dụng</b><span>${lot ? lot[2] : '---'}</span></div>
                <div class="info-item"><b>Khách hàng</b><span>${lot ? lot[3] : '---'}</span></div>
            </div>
        </div>
    `;
}
