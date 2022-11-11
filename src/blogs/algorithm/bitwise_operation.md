---
title: 位运算基本操作与常用技巧
date: 2022-10-24
tags:
 - 位运算
categories: 
 - 算法
sidebar: auto
---

### 什么是位运算
位操作（Bit Manipulation）是程序设计中对位模式或二进制数的一元和二元操作。
在许多古老的微处理器上，位运算比加减运算略快，通常位运算比乘除法运算要快很多。
在现代编程语言中，情况并非如此，很多编程语言的解释器都会基本的运算进行了优化，
因此我们在实际开发中可以不必做一些编译器已经帮我们做好的优化，
而就写出代码本身所要表现的意思。

### 前置知识
**计算机内部的数值**
- [定点数](https://baike.baidu.com/item/%E5%AE%9A%E7%82%B9%E6%95%B0?fromModule=lemma_inlink)
- [原码](https://baike.baidu.com/item/%E5%8E%9F%E7%A0%81/1097586?fromModule=lemma_inlink)
- [反码](https://baike.baidu.com/item/%E5%8F%8D%E7%A0%81/769985?fromModule=lemma_inlink)
- [补码](https://baike.baidu.com/item/%E8%A1%A5%E7%A0%81?fromModule=lemma_inlink)

### 基本的位运算操作
1. `&` 与， 两个位都为1时，结果才为1
2. `|` 或， 两个都为0时，结果才为0
3. `^` 异或, 两个位相同为0， 相异为1
4. `~` 取反，0变1，1变0
5. `<<` 左移，各个二进位全部左移若干位，高位丢弃，低位补0
6. `>>` 右移，各二进位全部右移若干位，对无符号数，高位补0，有符号数， 各编译器处理方法不一样，有的补符号位（算术右移），有的补0（逻辑右移）

### 算法常用技巧
1. 除法  
`a >> i`       a 除以 2 的`i` 次方  
2. 乘法  
`a << i`       a 乘以 2 的`i` 次方  
3. 判断奇偶数  
`a & 1`        变量`a`的最后一个二进制位值
4. 统计二进制中1的个数
`a & (a - 1)`  将变量`a`的二进制位最后一个1置0  
5. 查看第`i`个二进制位是否为1 (值为1或0)  
`(a >> i) & 1` 
6. 不用临时变量交换两个数
```
a ^= b
b ^= a
a ^= b
```
7. [leetcode题目 不使用运算符实现加法](https://leetcode.cn/problems/bu-yong-jia-jian-cheng-chu-zuo-jia-fa-lcof/)
```python 
a, b = 123, 456
while b != 0:
    carry = (a & b) << 1  # a & b （两者都为1的时候进位）
    a ^= b                # 除进位条件下其余满足加法运算 0^0=0,0^1=1
    b = carry             # 将所有需要进位的当做b，仅需进行上述运算，直至b为0
print(a)
```


