---
title: 测试文章
published: 2026-06-27
description: 无意义，仅用于测试
author: "LJH"
tags: [开发,测试]
category: 开发
draft: false
---

### 公式样式

- 积分
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

- 矩阵
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

- 求和与极限
$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

$$
\lim_{x \to 0} \frac{\sin x}{x} = 1
$$

- 化学方程式
$$
\ce{CH4 + 2O2 -> CO2 + 2H2O}
$$

### 提示框测试
> [!NOTE] 提示
> 突出显示用户应该注意的信息。

> [!TIP] 建议
> 可选信息，帮助用户更成功。

> [!IMPORTANT] 重要
> 用户必须了解的关键信息。

> [!WARNING] 警告
> 需要立即注意的关键内容。

> [!CAUTION] 注意
> 行动的负面潜在后果。

### 代码样式测试

```python
class Solution:
    def mySqrt(self, x: int) -> int:
        inf = 1e-3
        guess = x
        while True:
            try:
                next_guess = (guess + x / guess) / 2.0
            except ZeroDivisionError:
                return 0
            if abs(next_guess - guess) < inf:
                return int(next_guess)
            guess = next_guess
```
