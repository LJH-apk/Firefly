---
title: Python入门指南（1）从头开始
published: 2026-06-28
description: 本篇主要讲解python环境的配置、以及编写第一个程序
tags: [Code, Python]
category: Python入门指南
draft: false
author: "小刘同学"
image: "https://s41.ax1x.com/2026/06/28/pmUv3TK.jpg"
---

从本篇开始，我们正式开启学习Python的旅程。
学习Python的第一步便是在电脑上安装Python环境，以及在自己电脑编写第一个Python程序。下面，我们将一一介绍。

### 安装Python环境

安装Python有多种方式，包括从官网下载，部分电脑自带的应用市场也提供Python的安装包。

> [!NOTE] 提示
> 我建议各位读者从官网下载并安装

应用市场下载的Python安装程序可能是一些较老的或者进行精简过的版本，可能在后面的开发中出现一些意外的问题。所以我建议各位读者从**官网**下载并安装Python环境。
Python的具体[下载链接](https://www.python.org/downloads/)，打开后网页入如下图所示。
![Python下载页](https://s41.ax1x.com/2026/06/28/pmUx9hD.jpg)
先点击 Downloads 后面根据你的操作系统选择对应的版本，下文演示Windows/macOS系统下的操作流程。

#### Windows系统

我这里使用Windows 11 作为演示例子。其余版本Windows操作系统安装过程相似

##### 安装解释器

您在Windows下安装Python可以遵循如下操作。在Python官网下载页点击 Downloads 再点击 windows 或者，你也可以[点击此处](https://www.python.org/downloads/windows/)跳转到Python下载页。在Stable Releases 选择一个Python版本，我这里选择Python3.13.14。如下图所示。
![Python版本选择](https://s41.ax1x.com/2026/06/28/pmaSZY8.jpg)
下载完成后打开安装器，勾选`Add python.exe to PATH`和`Use admin privileges when installing py.exe`这两个选项，然后点击`Install Now`等待安装完成即可。
![安装过程](https://s41.ax1x.com/2026/06/28/pmapZH1.jpg)

##### 验证安装

验证安装时，需要使用`Powershell`，需要先按键盘上`Win + R`组合键，打开“运行”，然后在“运行”中输入`powershell`，点击"确定"即可。
![启动PowerShell流程](https://s41.ax1x.com/2026/06/28/pmapmAx.jpg)
打开Powershell后，输入命令

```powershell
python
```

按Enter（回车）键应该得到

```powershell
Python 3.13.14 (tags/v3.13.14:fd17997, Jun 10 2026, 13:03:48) [MSC v.1944 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

类似这样的结果，Python即安装成功。

#### macOS系统

##### 安装解释器

macOS下安装Python相对简单。在Python官网下载页点击 Downloads 再点击 macOS 选择版本。或者，你也可以[点击此处](https://www.python.org/downloads/macos/)跳转到Python下载页。在Stable Releases 选择一个Python版本，我这里选择Python3.13.14。如下图所示。
![Python版本选择](https://s41.ax1x.com/2026/06/28/pmUxU4U.jpg)
下载完成后，打开下载到的python-3.13.14-macos11.pkg，会有这样的页面。
![安装器](https://s41.ax1x.com/2026/06/28/pmUxruR.jpg)
一直点击**继续**，等待系统安装完成即可。

##### 验证安装

点按系统Dock栏上的“App”，输入“终端”，打开你的系统终端。或者更简洁的方式，按`Cmd + Space`搜索“终端”。在终端中输入如下命令：

```bash
python3 --version
```

得到`Python 3.13.14`这样的结果，即证明Python已经正确安装。

### 编写第一个Python程序

正确安装Python后我们便可以开始编写我们的第一个程序。
打开终端/Powershell后，我们执行如下命令
Windows用户执行

```powershell
python
```

macOS用户执行

```bash
python3
```

执行对应命令后，应该有类似下面的页面

```
Python 3.13.14 | packaged by Anaconda, Inc. | (main, Jun 12 2025, 11:23:37) [Clang 14.0.6 ] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

这个页面我们称之为**Python的交互式环境**，这个环境的特点是**即时反馈**，你输入的命令可以立刻得到回应。我们可以先尝试输入`print("Hello World")`，系统应该会返回`Hello World`。完整的命令交互内容如下

```bash
Python 3.13.14 | packaged by Anaconda, Inc. | (main, Jun 12 2025, 11:23:37) [Clang 14.0.6 ] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> print("Hello World")
Hello World
>>>
```

如果你能够成功做到这里，那么恭喜你，你完成了你的**第一个**Python程序
