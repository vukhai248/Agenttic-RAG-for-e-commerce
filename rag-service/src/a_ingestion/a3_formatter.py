import re
from typing import Tuple, Optional, Dict, Any

class DataFormatter:
    """Class for formatting product and policy data."""
    
    @staticmethod
    def extract_dimensions(dim_str: Optional[str]) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        """
        Trích xuất 3 số thực (Dài, Rộng, Dày) từ chuỗi kích thước bất kỳ.
        Trả về tuple: (Dài, Rộng, Dày) dưới dạng số thực (float).
        Nếu không tìm đủ 3 số hoặc chuỗi trống, trả về (None, None, None).
        """
        if not dim_str or not isinstance(dim_str, str):
            return None, None, None
        
        # Tìm tất cả các số thực hoặc số nguyên có trong chuỗi
        numbers = re.findall(r"\d+(?:\.\d+)?", dim_str)
        
        # Kiểm tra nếu tìm thấy ít nhất 3 con số
        if len(numbers) >= 3:
            try:
                length = float(numbers[0])     
                width = float(numbers[1])      
                thickness = float(numbers[2])  
                return length, width, thickness
            except ValueError:
                pass
                
        return None, None, None
    
    def format_product_to_text(self, prod: Dict[str, Any]) -> str:
        """
        Hàm phân tích object JSON sản phẩm và ghép nối thành một 
        đoạn văn bản thống nhất (Unified Text Document).
        """
        # 1. Lấy và định dạng các thông tin cơ bản cấp 1
        name = prod.get("name", "Không rõ tên")
        brand = prod.get("brand", "Không rõ thương hiệu")
        category = prod.get("category", "Sản phẩm")
        
        # Định dạng hiển thị giá tiền
        price_val = prod.get("price")  or 0
        final_price_val = prod.get("final_price") or prod.get("special_price") or price_val
        discount_val = prod.get("discount") or 0
        
        price_text = f"{final_price_val:,.0f} VNĐ" if final_price_val > 0 else "Liên hệ"
        original_price_text = f"{price_val:,.0f} VNĐ" if price_val > 0 else "Liên hệ"
        discount_text = f"{discount_val}%" if discount_val > 0 else "Không giảm giá"
        
        # Tồn kho
        stock = prod.get("stock", 0)
        stock_text = f"Còn hàng ({stock} sản phẩm)" if stock > 0 else "Hết hàng"
        
        # 2. Phân tích và làm sạch phần thông số kỹ thuật (specs)
        specs_dict = prod.get("specs", {}) or {}
        
        # Vi xử lý (CPU, Chipset)
        cpu = prod.get("cpu")
        if not cpu and "Chipset" in specs_dict:
            cpu = specs_dict.get("Chipset")

        # GPU, Card đồ họa
        gpu = prod.get("gpu") or specs_dict.get("vga") or specs_dict.get("laptop_vga_filter")
        # RAM 
        ram = prod.get("ram") or specs_dict.get("RAM")

        # Bộ nhớ lưu trữ (cho laptop/điện thoại)
        storage = specs_dict.get("o_cung_laptop") or prod.get("storage") or specs_dict.get("Luu tru")

        # Thôg tin màn hình
        display_size = prod.get("display_size") or specs_dict.get("Man hinh")
        display_resolution = prod.get("display_resolution") or specs_dict.get("Do phan giai")
        display_type = specs_dict.get("display_type") or prod.get("display_type") or None
        refresh_rate = (
            prod.get("refresh_rate")
            or specs_dict.get("laptop_tan_so_quet") 
            or specs_dict.get("refresh_rate") 
            or None
        )
        panel_type = (
            specs_dict.get("laptop_tam_nen_man_hinh") 
            or specs_dict.get("Công nghệ màn hình") 
            or prod.get("display_type") 
            or specs_dict.get("display_type") 
            or prod.get("panel_type") 
            or specs_dict.get("panel_type") 
            or None
        )

        # Pin thiết bị
        battery = prod.get("battery") or specs_dict.get("Pin") or specs_dict.get("battery")

        # Hệ điều hành OS
        os = prod.get("os") or specs_dict.get("HDH") or None

        # Cân nặng
        weight = prod.get("weight") or specs_dict.get("product_weight") or None

        # Kích thước thực tế (Dài x Rộng X Dày)
        raw_dim = prod.get("dimensions") or specs_dict.get("Kich thuoc")
        dimensions = self.extract_dimensions(raw_dim)

        # Camera
        camera_primary = prod.get("camera_primary") or specs_dict.get("Camera sau") or None
        camera_secondary = prod.get("camera_secondary") or specs_dict.get("Camera truoc") or specs_dict.get("laptop_camera_webcam") or None
        camera_video = prod.get("camera_video") 

        # Công nghệ âm thanh (hiện chỉ cho laptop)
        audio = specs_dict.get("laptop_cong_nghe_am_thanh") or specs_dict.get("audio") or None

        # Bluetooth
        bluetooth = specs_dict.get("Bluetooth") or None

        # Phụ kiện kèm theo
        included_accessories = prod.get("included_accessories") or specs_dict.get("included_accessories") or None
        
        # Tình trạng sản phẩm (cho laptop trước)
        product_state = specs_dict.get("product_state") or None

        # Miêu tả về sản phẩm
        key_selling_points = prod.get("key_selling_points") or None

        # Mô tả chi tiết về sản phẩm (tóm tắt)
        description = prod.get("description") or None

        # ---------------- Dành riêng cho laptop
        # Lấy loại đèn nền bàn phím
        keyboard_backlight = specs_dict.get("laptop_loai_den_ban_phim") or None
        # npu (Neural Processing Unit)
        npu = specs_dict.get("npu") or None
        # wifi
        wlan = specs_dict.get("wlan") or prod.get("wlan") or None
        # Cổng kết nối
        ports_slots = specs_dict.get("ports_slots") or None
        # Loại bảo mật
        security = specs_dict.get("laptop_bao_mat") or None
        # Chất liệu máy
        material = specs_dict.get("laptop_chat_lieu") or None
        # Số khe ram
        ram_slots = specs_dict.get("laptop_so_khe_ram") or None
        # Loại ram
        ram_type = specs_dict.get("laptop_loai_ram") or None
        # Khe đọc thẻ nhớ
        card_reader = specs_dict.get("laptop_khe_doc_the_nho") or None
        # Các tính năng đặc biệt
        laptop_special_feature = specs_dict.get("laptop_special_feature") or None
        # AI hỗ trợ
        ai_standard = specs_dict.get("laptop_cong_nghe_ai_filter") or None
        # Lấy tác vụ/nhu cầu khuyên dùng
        usage_overall = specs_dict.get("nhu_cau_su_dung") or None
        usage_detail = specs_dict.get("laptop_filter_tac_vu_su_dung") or None
        if usage_overall and usage_detail:
            recommended_usage = f"{usage_overall} (Tối ưu cho: {usage_detail})"
        elif usage_overall:
            recommended_usage = usage_overall
        else:
            recommended_usage = usage_detail or None

        # === 4. Ghép nối tất cả thành một đoạn văn bản có cấu trúc ===
        specs_lines = []
        
        # Gom các thông số chung của cả laptop và điện thoại
        if cpu: specs_lines.append(f"- Bộ vi xử lý (CPU/Chipset): {cpu}")
        if ram: specs_lines.append(f"- Dung lượng RAM: {ram}")
        if ram_type: specs_lines.append(f"- Chuẩn/Loại RAM: {ram_type}")
        if ram_slots: specs_lines.append(f"- Số khe cắm RAM: {ram_slots}")
        if storage: specs_lines.append(f"- Dung lượng lưu trữ: {storage}")
        if display_size: specs_lines.append(f"- Kích thước màn hình: {display_size}")
        if display_resolution: specs_lines.append(f"- Độ phân giải màn hình: {display_resolution}")
        if display_type: specs_lines.append(f"- Công nghệ màn hình: {display_type}")
        if panel_type: specs_lines.append(f"- Loại tấm nền màn hình: {panel_type}")
        if refresh_rate: specs_lines.append(f"- Tần số quét màn hình: {refresh_rate}")
        if battery: specs_lines.append(f"- Dung lượng Pin: {battery}")
        if gpu: specs_lines.append(f"- Card đồ họa (GPU/VGA): {gpu}")
        if os: specs_lines.append(f"- Hệ điều hành: {os}")
        if weight: specs_lines.append(f"- Trọng lượng: {weight}")
        
        # Định dạng kích thước nếu là tuple từ hàm extract_dimensions
        if dimensions:
            if isinstance(dimensions, (tuple, list)) and len(dimensions) >= 3:
                specs_lines.append(f"- Kích thước thiết bị: {dimensions[0]} x {dimensions[1]} x {dimensions[2]} mm")
            else:
                specs_lines.append(f"- Kích thước thiết bị: {dimensions}")
                
        # Xử lý làm sạch dấu xuống dòng \n của Camera, Phụ kiện Cổng kết nối để văn bản nhúng liền mạch
        if camera_primary: 
            specs_lines.append(f"- Camera chính (sau): {str(camera_primary).replace('\\n', ', ')}")
        if camera_secondary: 
            specs_lines.append(f"- Camera phụ / Webcam: {str(camera_secondary).replace('\\n', ', ')}")
        if camera_video: 
            specs_lines.append(f"- Tính năng quay phim: {str(camera_video).replace('\\n', ', ')}")
        if audio: 
            specs_lines.append(f"- Công nghệ âm thanh: {str(audio).replace('\\n', ', ')}")
        if bluetooth: 
            specs_lines.append(f"- Kết nối Bluetooth: {bluetooth}")
        if wlan: 
            specs_lines.append(f"- Kết nối Wi-Fi: {wlan}")
        if ports_slots: 
            specs_lines.append(f"- Cổng kết nối & khe cắm:\\n  {str(ports_slots).replace('\\n', '\\n  ')}")
        if card_reader: 
            specs_lines.append(f"- Khe đọc thẻ nhớ: {card_reader}")
        if keyboard_backlight: 
            specs_lines.append(f"- Đèn nền bàn phím: {keyboard_backlight}")
        if npu: 
            specs_lines.append(f"- Bộ xử lý AI (NPU): {npu}")
        if security: 
            specs_lines.append(f"- Công nghệ bảo mật: {security}")
        if material: 
            specs_lines.append(f"- Chất liệu vỏ máy: {material}")
        if laptop_special_feature: 
            specs_lines.append(f"- Tính năng đặc biệt khác: {laptop_special_feature}")
        if ai_standard: 
            specs_lines.append(f"- Tiêu chuẩn công nghệ AI: {ai_standard}")
        if recommended_usage: 
            specs_lines.append(f"- Nhu cầu/Tác vụ tối ưu: {recommended_usage}")
        if product_state: 
            specs_lines.append(f"- Tình trạng sản phẩm: {str(product_state).replace('\\n', ', ')}")
        if included_accessories: 
            specs_lines.append(f"- Phụ kiện kèm theo trong hộp: {str(included_accessories).replace('\\n', ', ')}")

        specs_text = "\\n".join(specs_lines)

        # Ghép nối thành các đoạn văn bản lớn
        unified_text_parts = [
            f"Sản phẩm: {name}",
            f"Thương hiệu: {brand} | Danh mục: {category}",
            f"Thông tin giá & Kho hàng:\\n- Giá thực tế: {price_text}\\n- Giá gốc niêm yết: {original_price_text}\\n- Mức giảm giá: {discount_text}\\n- Tình trạng: {stock_text}"
        ]
        
        if specs_text:
            unified_text_parts.append(f"Thông số kỹ thuật chi tiết:\\n{specs_text}")
            
        if key_selling_points and key_selling_points.strip():
            unified_text_parts.append(f"Đặc điểm nổi bật:\\n{key_selling_points.strip()}")
            
        if description and description.strip():
            unified_text_parts.append(f"Mô tả chi tiết sản phẩm:\\n{description.strip()}")
            
        # Nối tất cả các phần lại bằng dấu xuống dòng kép
        return "\\n\\n".join(unified_text_parts)
