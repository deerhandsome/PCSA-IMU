# PCSA IMU 实时推理实验App（PWA）

这是**可安装至iPhone主屏幕的网页应用**，不是已签名的原生IPA。它复用经过合成波形训练的小型Conv1D网络，在手机上运行真实JavaScript网络前向计算。**不能用于评估PCSA-PA真实分类精度或Core ML原生推理速度**。

## iPhone安装
1. 将整个文件夹（包含 `index.html`、`manifest.webmanifest`、`sw.js` 与 `icons/`）上传至GitHub Pages等**HTTPS静态托管服务**。不要只上传HTML。
2. 在iPhone Safari中打开HTTPS链接，点击分享菜单→“添加到主屏幕”→启用“作为Web App打开”→添加。
3. 从主屏幕打开“PCSA IMU”；点击“开始iPhone真实采集并推理”，在提示时授予运动权限。若主屏幕App无法获得运动事件，先在Safari标签页打开网站测试；部分iOS版本对主屏幕网页App的传感器权限/后台行为可能有限制。
4. 等待首个6秒窗口，观察实时四类概率、网络P50/P95、截止率。停止后立即导出原始CSV及预测CSV。

## 实验限制
- 只能在前台、屏幕点亮且浏览器提供运动事件的条件下测试。锁屏、后台采集和精确CPU/内存/电池计量不能按原生App标准主张。
- 使用合成数据训练的演示模型，预测活动名称仅供验证链路。
- 采集与推理都在用户手机上，默认不上传传感器数据；导出CSV后请妥善保存。
- PWA Service Worker缓存用于重复打开，并**不保证Safari在离线时授予传感器权限**。

## 真正原生IPA
需要macOS/Xcode或云端macOS构建、iOS签名和安装分发路径（TestFlight等）。该PWA不是IPA，也不能替代原生Core ML、Instruments或可靠后台采集测试。
