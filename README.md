Weather realtime React logic (VN)

Thiết lập nhanh

- Tạo API key tại OpenWeatherMap (miễn phí): https://openweathermap.org/
- Sao chép file .env.example thành .env và điền giá trị cho VITE_WEATHER_API_KEY
- Dùng Vite hoặc CRA đều chạy được. Với Vite: npm create vite@latest; chép thư mục src/ và index.html vào dự án.

Biến môi trường

- VITE_WEATHER_API_KEY: API key OpenWeatherMap
- VITE_WEATHER_BASE_URL: Mặc định https://api.openweathermap.org/data/2.5
- VITE_WEATHER_UNITS: metric | imperial (mặc định metric)
- VITE_WEATHER_LANG: ngôn ngữ mô tả thời tiết (mặc định vi)
- VITE_WEATHER_POLL_MS: chu kỳ cập nhật ms (mặc định 60000)

Các phần chính

- src/api/weatherClient.js: Gọi API thời tiết (current/forecast)
- src/hooks/useGeolocation.js: Lấy toạ độ GPS theo thời gian thực
- src/hooks/useWeather.js: Lấy dữ liệu + polling + cache + retry
- src/context/WeatherProvider.jsx: Chia sẻ city/coords cho app
- src/App.jsx: Ví dụ sử dụng (bạn có thể SCSS lại)

“Real-time” & tối ưu

- Polling theo chu kỳ, tự bỏ qua khi tab ẩn để tiết kiệm quota
- Làm mới khi tab lấy focus hoặc khi mạng online lại
- Cache TTL ngắn tránh spam API, kèm retry backoff

Tuỳ biến provider

- Nếu bạn muốn đổi sang provider khác, chỉ cần sửa src/api/weatherClient.js (định dạng JSON trả về có thể khác, nhớ map lại các field trong App.jsx/useWeather nếu cần).

Lỗi thường gặp

- 401 Unauthorized với OpenWeather khi dùng `/data/3.0`: Các endpoint `/weather` và `/forecast` thuộc API v2.5. Hãy dùng `https://api.openweathermap.org/data/2.5` trong `.env`. Client đã tự động fallback từ 3.0 → 2.5 cho 2 endpoint này, nhưng bạn vẫn nên để đúng base URL để tránh nhầm lẫn.
