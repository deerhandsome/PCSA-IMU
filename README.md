# PCSA-PA iPhone Safari — 实际训练模型部署包

## 已实现

- 真实四个 PCSA-PA / PHYSICS_ATTR / A0 ONNX 模型，对应 UCI、MotionSense、HHAR、Shoaib 的 fold0 seed42，保持原文件内容。
- 从上传的 `preprocess.py` 和 `native/data_processing.py` 移植到 `preprocess.js` 的 **20 Hz / 120 帧** 预处理：重力估计、auto 模式、必要时 winsorization、3D 旋转、8 个物理通道、周期 Hann+rFFT 61 点功率谱、32 个统计量。模型中的源训练归一化参数仍保留在 ONNX 图中。
- 真实 DeviceMotionEvent 采集、1 秒更新的尾随 6 秒窗口、窗口有效性检查、四类概率、ONNX 延迟统计、原始 IMU/预测/真值 CSV 导出。
- 参考样本按钮可验证模型在网页中的接口。请区分参考窗口和真正的手机实时采集。

## 文件

- `index.html`：新首页，默认真实 PCSA-PA 模型实验；需要与其它文件一起部署。
- `preprocess.js`：浏览器端预处理。
- `models/*.onnx`：四个未经修改的真实 ONNX 图。
- `reference/*.json`：各源域的一个源验证窗口及冻结源概率。
- `legacy-synthetic-demo.html`：前一版微型合成分类器，仅供历史比较；不是 PCSA-PA。
- `deployment-manifest.json`：本次部署包的身份、模型校验与验证界限。

## GitHub Pages 部署

1. 在 `https://github.com/deerhandsome/PCSA-IMU` 的根目录备份原 `index.html`；本包 `legacy-synthetic-demo.html` 另提供旧演示副本。
2. 上传本包 `index.html`、`preprocess.js`、`models/`、`reference/` 至根目录（保持相对路径）。
3. GitHub Pages 分支设置保持 `main` / `/ (root)`（如果原网站已启用，则无需改变）。访问 `https://deerhandsome.github.io/PCSA-IMU/`。
4. iPhone Safari 打开后选择一个源域模型并点击“加载真实 ONNX 模型”，可先运行“真实参考窗口”检查网页完整性。
5. 之后点击“授权运动传感器并开始”，将手机固定在实验约定位置，等待至少六秒完整运动数据，分动作标注并采集，停止后导出三个 CSV。

> 本次对远程 GitHub 的写入请求返回 HTTP 403，因此**没有直接发布到线上**。请上传完整目录，不能只上传 index.html。

## 数值检查与研究限制

部署包提供的四个 ONNX 在原材料 `qa/onnx_validation.json` 中记录了 1/7/32 batch 的 PyTorch 对照。我们独立对四个参考窗口复核 JS 预处理 vs Python；最大的物理表示误差为 `9.54e-7`、频谱误差为 `2.73e-6`、统计量误差为 `1.91e-6`。这只是输入预处理数值核对；**尚未在实际 iPhone Safari 运行完整 ONNX**，网页实时精度和延迟都必须实测。

还需关注：

- iPhone `accelerationIncludingGravity` 为 m/s²，`rotationRate` 在 Web API 通常使用 deg/s，页面转换为 rad/s；需检查设备型号和实际数据。
- 训练域与 iPhone 的传感器轴顺序、符号、手持/腰部/口袋放置、滤波及采样率可能不同。这里没有隐式宣称跨设备的无校准等价。
- 页面用实际事件时间轴做线性插值到 20Hz，不是原包均匀采样时的多相抗混叠重采样。适用于部署原型，但不能将两种采样处理宣称完全一致。
- 窗口内的重力估计采用双向滤波：需等待完整六秒输入，因此不适用于声称逐帧零延迟。
- 浏览器计算时间包含 WASM 网络计算时间和 JS 预处理，不等于能耗测试、Core ML 推理时间或前 6 秒的采样等待。
- 论文 12 个迁移方向、36 个模型得到的 Macro-F1 不能由一个 iPhone 示例权重推断。任何手机端 Accuracy / Macro-F1 都需真实时间戳真值与跨受试者设计。
- 页面从 jsDelivr 获取 ONNX Runtime Web 1.20.1；若网络无法访问，该页面不具备完全离线运行条件，可改用同版官方 WASM 文件在站点内托管。

## 后续建议

优先安排静止 → 步行 → 上楼 → 下楼的分段协议，各类按时间准确标注，记录手机具体型号、iOS/Safari 版本、佩戴位置、原始事件频率、温度和电量。先做源模型间的相同时间窗成对比较，再谈跨域泛化或论文数据。
