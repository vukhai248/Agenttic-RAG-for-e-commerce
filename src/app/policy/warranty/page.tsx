import React from 'react';

export default function WarrantyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-300">
      <h1 className="text-3xl font-extrabold text-white mb-8 border-b border-slate-800 pb-4">
        Chính Sách Bảo Hành Sản Phẩm
      </h1>
      
      <p className="mb-6 leading-relaxed">
        Chào mừng quý khách đến với trung tâm bảo hành của chúng tôi. Nhằm đảm bảo quyền lợi tối đa cho khách hàng và cam kết chất lượng sản phẩm dịch vụ, chúng tôi xin công bố chính sách bảo hành chính thức cho toàn bộ các sản phẩm công nghệ (Laptop, Điện thoại, Đồng hồ thông minh, Tai nghe và Phụ kiện) được bán ra trên toàn hệ thống.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">1. Thời Hạn Bảo Hành Quy Định</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-850">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 border border-slate-800">Nhóm sản phẩm</th>
                <th className="p-3 border border-slate-800">Thời hạn bảo hành</th>
                <th className="p-3 border border-slate-800">Hình thức áp dụng</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800">
                <td className="p-3 font-semibold text-white">Laptop</td>
                <td className="p-3">12 đến 24 tháng (tùy hãng)</td>
                <td className="p-3">Sửa chữa thay thế linh kiện chính hãng hoặc đổi mới</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="p-3 font-semibold text-white">Điện thoại di động</td>
                <td className="p-3">12 tháng</td>
                <td className="p-3">Sửa chữa chính hãng tại TTBH ủy quyền</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="p-3 font-semibold text-white">Đồng hồ thông minh</td>
                <td className="p-3">12 tháng</td>
                <td className="p-3">1 đổi 1 trong 30 ngày đầu, sửa chữa 11 tháng tiếp theo</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="p-3 font-semibold text-white">Tai nghe (Earphone/Headphone)</td>
                <td className="p-3">12 tháng</td>
                <td className="p-3">1 đổi 1 nếu lỗi NSX trong suốt thời gian bảo hành</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Phụ kiện (Củ sạc, Cáp sạc, Pin dự phòng)</td>
                <td className="p-3">6 đến 18 tháng (tùy dòng GaN/Thường)</td>
                <td className="p-3">Đổi mới thiết bị cùng loại</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">2. Điều Kiện Nhận Bảo Hành Miễn Phí</h2>
        <ul className="list-disc pl-6 space-y-2 leading-relaxed">
          <li>Sản phẩm vẫn còn trong thời hạn bảo hành tính từ ngày mua hàng (ghi trên hóa đơn điện tử hoặc kích hoạt điện tử bảo hành).</li>
          <li>Sản phẩm gặp lỗi kỹ thuật được xác định là do nhà sản xuất (lỗi phần cứng, lỗi linh kiện bên trong không do tác động ngoại lực).</li>
          <li>Số Serial Number (S/N) hoặc IMEI trên thân máy và trong phần mềm máy phải trùng khớp, không bị tẩy xóa, sửa chữa hay bong tróc rách nát.</li>
          <li>Tem niêm phong bảo hành của cửa hàng hoặc của nhà phân phối (nếu có) phải còn nguyên vẹn, không có dấu hiệu bị tháo mở hoặc cạy phá.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">3. Các Trường Hợp Bị Từ Chối Bảo Hành</h2>
        <p className="mb-3">Chúng tôi có quyền từ chối bảo hành đối với các sản phẩm vi phạm một trong các điều khoản sau (hỗ trợ sửa chữa tính phí dịch vụ ngoài bảo hành):</p>
        <ul className="list-disc pl-6 space-y-2 leading-relaxed">
          <li>Sản phẩm đã hết thời hạn bảo hành quy định.</li>
          <li>Thiết bị bị hư hỏng cơ học do người sử dụng: rơi vỡ, móp méo, trầy xước nặng, biến dạng thân vỏ do nhiệt độ cao hoặc tỳ đè lực mạnh.</li>
          <li>Sản phẩm bị chất lỏng xâm nhập (vào nước), ẩm mốc, ô-xy hóa bản mạch do môi trường ẩm ướt hoặc hóa chất ăn mòn, bất kể sản phẩm có tính năng kháng nước (IP67, IP68, 5ATM).</li>
          <li>Hư hỏng do sử dụng sai nguồn điện (quá áp, chập cháy nổ IC nguồn do dòng điện không ổn định), sử dụng phụ kiện sạc fake không đúng tiêu chuẩn nhà sản xuất khuyến cáo.</li>
          <li>Thiết bị đã bị tự ý tháo dỡ, sửa chữa hoặc thay thế linh kiện tại các cơ sở dịch vụ không được sự ủy quyền chính thức từ hãng hoặc cửa hàng của chúng tôi.</li>
          <li>Hư hỏng do thiên tai, hỏa hoạn, động vật hoặc côn trùng xâm nhập cắn phá dây cáp mạch điện bên trong.</li>
          <li>Lỗi liên quan đến phần mềm tự ý can thiệp hệ thống sâu (Root, Jailbreak, chạy ROM cook sai phiên bản gây chết Bootloader của điện thoại/đồng hồ).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">4. Quy Trình Bảo Hành Tiêu Chuẩn</h2>
        <ol className="list-decimal pl-6 space-y-3 leading-relaxed">
          <li>
            <strong className="text-white">Bước 1: Tiếp nhận thông tin.</strong> Khách hàng liên hệ với tổng đài chăm sóc khách hàng hoặc mở ticket hỗ trợ trên website qua chatbot hỗ trợ để nhân viên xác nhận tình trạng sơ bộ.
          </li>
          <li>
            <strong className="text-white">Bước 2: Gửi sản phẩm.</strong> Quý khách mang sản phẩm trực tiếp đến cửa hàng gần nhất hoặc gửi qua đường bưu điện (chúng tôi sẽ thanh toán phí vận chuyển 2 chiều nếu xác định lỗi do NSX).
          </li>
          <li>
            <strong className="text-white">Bước 3: Kiểm tra kỹ thuật.</strong> Kỹ thuật viên sẽ tiến hành kiểm tra máy trong vòng 24 giờ đến 48 giờ làm việc để đưa ra kết luận lỗi và thông báo phương án xử lý bảo hành cho khách.
          </li>
          <li>
            <strong className="text-white">Bước 4: Thực hiện sửa chữa/Đổi trả.</strong> Tiến hành sửa chữa phần cứng hoặc làm thủ tục đổi mới trong vòng 3-7 ngày làm việc (trừ trường hợp linh kiện hãng hiếm phải chờ nhập khẩu lâu hơn).
          </li>
          <li>
            <strong className="text-white">Bước 5: Bàn giao.</strong> Bàn giao lại thiết bị đã bảo hành hoàn chỉnh cho khách kèm phiếu nghiệm thu sửa chữa và thời gian bảo hành cộng thêm (nếu có).
          </li>
        </ol>
      </section>
    </div>
  );
}
