---
title: python checklist
date: 2019-06-03
tags:
 - python
 - 代码规范
 - 开发规范
 - pep8
 - 工程实践
 - 入门级
 - 开发工具
categories: 
 - python
sidebar: auto
---

### 缩进
----
- 不直接使用 `tab` 缩进
- 使用任何编辑器写 `Python`，请把一个 `tab` 展开为 4 个空格
- 不要混用`tab`和空格，否则容易出现 `IndentationError`
----
### 空格
- 在 `list`, `dict`, `tuple`, `set`, 参数列表的 , 后面加一个空格
- 在 `dict` 的 : 后面加一个空格
- 在注释符号 # 后面加一个空格，但是 `#!/usr/bin/python` 的 `#` 后不能有空格
- 操作符两端加一个空格，如 `+, -, *, /, |, &, =`
- 接上一条，在参数列表里的 = 两端不需要空格
- 括号（`(), {}, []`）内的两端不需要空格
----
### 空行
- `function` 和 `class` 顶上两个空行
- `class` 的 `method` 之间一个空行
- 函数内逻辑无关的段落之间空一行，不要过度使用空行
- 不要把多个语句写在一行，然后用 ; 隔开
- `if/for/while` 语句中，即使执行语句只有一句，也要另起一行
----
### 换行
- 每一行代码控制在 80 字符以内
- 使用 \ 或 () 控制换行
### 命名
使用有意义的，英文单词或词组，不要使用汉语拼音
package/module 名中不要出现 -
各种类型的命名规范：

Type|	Public|	Internal|
---|---|---|
Modules	|lower_with_under|	_lower_with_under
Packages|	lower_with_under	
Classes	CapWords|	_CapWords
Exceptions|	CapWords	
Functions|	lower_with_under()|_lower_with_under()
Global/Class Constants|	CAPS_WITH_UNDER	|_CAPS_WITH_UNDER
Global/Class Variables	|lower_with_under	|_lower_with_under
Instance Variables|	lower_with_under	|_lower_with_under (protected) or __lower_with_under (private)
Method Names|lower_with_under()|	_lower_with_under() (protected) or __lower_with_under() (private)
Function/Method Parameters|lower_with_under|
Local Variables	|lower_with_under
----  

### Pycharm开发常用快捷键
- `ctrl+alt+L`格式化代码，使用`ctrl+alt+O`格式化导入
- `shift+F6`重命名方法或者变量
- `ctrl+shift +/-`展开/折叠全部代码块
- `Alt+Enter`自动修正导入

----
### 导包
- `import` 的次序，先 `import Python 内置模块`，再 `import 第三方模块`，最后 `import 自己开发的项目中的其它模块`；这几种模块用空行分隔开来。
- 每个`import`应该独占一行。
- 不要使用 `from module import *`，除非是 `import` 常量定义模块或其它你确保不会出现命名空间冲突的模块。  
  
----
### 异常
- 像这样触发异常: `raise MyException("Error message")` 或者 `raise MyException` . 不要使用两个参数的形式( `raise MyException, "Error message"` )或者过时的字符串异常( `raise "Error message"` )
- 模块或包应该定义自己的特定域的异常基类, 这个基类应该从内建的`Exception`类继承. 模块的异常基类应该叫做”`Error`”.
- 永远不要使用 `except`: 语句来捕获所有异常, 也不要捕获 `Exception` 或者 `StandardError` , 除非你打算重新触发该异常, 或者你已经在当前线程的最外层(记得还是要打印一条错误消息). 在异常这方面, Python非常宽容, `except:` 真的会捕获包括Python语法错误在内的任何错误. 使用 `except:` 很容易隐藏真正的bug.
- 尽量减少`try/except`块中的代码量. `try`块的体积越大, 期望之外的异常就越容易被触发. 这种情况下, `try/except`块将隐藏真正的错误.
- 使用`finally`子句来执行那些无论`try`块中有没有异常都应该被执行的代码. 这对于清理资源常常很有用, 例如关闭文件.  

----
## Python编码
### 比较
- 空的 `list`, `str`, `tuple`, `set`, `dict` 和 `0`, `0.0`, `None` 都是 `False`
- 使用 `if some_list` 而不是 `if len(some_list)` 判断某个 `list` 是否为空，其他类型同理
- 使用 `is` 和 `is not` 与单例（如 `None`）进行比较，而不是用 `==` 和 `!=`
使用 `if a is not None` 而不是 `if not a is None`
- 用 `isinstance` 而不是 `type` 判断类型
不要用 `==` 和 `!=` 与 `True` 和 `False` 比较（除非有特殊情况，如在 `sqlalchemy` 中可能用到)  

### 性能
- 需要查询操作时用`dict`
- 使用`in`操作时用 `set` 加速 “存在性” 检查，`list` 的查找是线性的，复杂度 `O(n)`，`set` 底层是 `hash table`, 复杂度 `O(1)`，但用 `set` 需要比 `list` 更多内存空间
- `set` 的 `union`， `intersection`，`difference` 操作要比 `list` 的迭代要快。因此如果涉及到求 `list` 交集，并集或者差的问题可以转换为 `set` 来操作。
- python 中的字符串对象是不可改变的，因此对任何字符串的操作如拼接，修改等都将产生一个新的字符串对象，而不是基于原字符串，所以在字符串连接的使用尽量使用 `join()` 而不是 `+`
- 当对字符串可以使用正则表达式或者内置函数来处理的时候，选择内置函数。如 `str.isalpha()`，`str.isdigit()`，`str.startswith(('x', 'yz'))`，`str.endswith(('x', 'yz'))`
- 对字符进行格式化比直接串联读取要快，因此要使用
```
out_put = "she's name is {},and she is a {}".format(lili,girl)
```
而不是
```
out_put = "she's name is" + lili + ",and she is a " + girl
```  

- 使用列表解析（`list comprehension`）和生成器表达式（`generator expression`）
```
# 列表解析要比在循环中重新构建一个新的 list 更为高效，因此我们可以利用这一特性来提高运行的效率。
for i in range (1000000): 
     for w in list: 
         total.append(w) 
# 使用列表解析
for i in range (1000000): 
    a = [w for w in list]
```
生成器表达式则是直接返回一个生成器，在迭代的时候调用，效率很高
- 交换变量值时使用`a,b = b,a`而不是借助中间变量 `t=a`;`a=b`;`b=t`;
- python 定位程序性能瓶颈  
**python 内置了丰富的性能分析工具，如 `profile`,`cProfile` 与 `hotshot` 等。其中 `Profiler` 是 `python` 自带的一组程序，能够描述程序运行时候的性能，并提供各种统计帮助用户定位程序的性能瓶颈。Python 标准模块提供三种 `profilers`:`cProfile`,`profile` 以及 `hotshot`。**
```
# 使用 profile 进行性能分析
import profile 
def profileTest(): 
   Total =1; 
   for i in range(10): 
       Total=Total*(i+1) 
       print Total 
   return Total 
if __name__ == "__main__": 
   profile.run("profileTest()")
```
如果需要将输出以日志的形式保存，只需要在调用的时候加入另外一个参数。如 `profile.run("profileTest()","testprof")`。  

### 其他
- 使用 `for item in list` 迭代 `list`, `for index, item in enumerate(list)` 迭代 `list` 并获取下标
- 使用内建函数 `sorted` 和 `list.sort` 进行排序
- 使用装饰器(`decorator`)
- 使用 `with` 语句处理上下文
- 使用 `logging` 记录日志，配置好格式和级别
- 适量使用 `map`, `reduce`, `filter` 和 `lambda`，使用内建的 `all`, `any` 处理多个条件的判断