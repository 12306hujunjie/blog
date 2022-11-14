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
7. 取最后一个为1的位数()
```python3
a = 4
mask = a & -a
# 也可这样实现
ret = 1
while a & ret == 0:   # 从最低位开始按位与，如果当前为1则break，拿到的ret即为最后一个为1的数
    ret <<= 1
```
::: tip  
负数的补码展示是反码加一  
比如
`00000000 00000000 00000000 00000100` 原码4  
反码是所有取反  
`11111111 11111111 11111111 11111011`  
补码 加一  
`11111111 11111111 11111111 11111100` -4的补码展示
取 4 & -4 就会拿到最后为1的值，为`00000000 00000000 00000000 00000100`即4，  
前面再多个几个1，都是反码会被消掉  
:::
### 技巧活用
1. [leetcode题目 不使用运算符实现加法](https://leetcode.cn/problems/bu-yong-jia-jian-cheng-chu-zuo-jia-fa-lcof/)
::: tip  
Python，Java 等语言中的数字都是以 补码 形式存储的。但 Python 没有 int , long 等不同长度变量，即在编程时无变量位数的概念。 获取负数的补码： 需要将数字与十六进制数 0xffffffff 相与。可理解为舍去此数字 32 位以上的数字（将 32 位以上都变为 000 ），从无限长度变为一个 32 位整数。 返回前数字还原： 若补码 aaa 为负数（ 0x7fffffff 是最大的正数的补码 ），需执行 ~(a ^ x) 操作，将补码还原至 Python 的存储格式。 a ^ x 运算将 1 至 32 位按位取反； ~ 运算是将整个数字取反；因此， ~(a ^ x) 是将 32 位以上的位取反，1 至 32 位不变。
:::  

:::: code-group  
::: code-group-item python3  
```python
a, b = 123, 456
x = 0xffffffff
a, b = x&a, x&b    # 32位以上的数字置为0 获取负数补码

while b != 0:
    carry = (a & b) << 1 & x   # a & b （两者都为1的时候进位）
    a ^= b                     # 除进位条件下其余满足加法运算 0^0=0,0^1=1
    b = carry                      # 将所有需要进位的当做b，仅需进行上述运算，直至b为0
a = a if a <= x else ~(a ^ x)    # 负数 32位以上取反， 1至32位不变
print(a)
```
:::  
::: code-group-item golang  
```golang
func add(a int, b int) int {
    for b != 0 {
        carry := (a & b) << 1
        a ^= b
        b = carry
    }
    return a
}
```
:::  
::::

2. [leetcode 剑指 Offer 56 - I. 数组中数字出现的次数](https://leetcode.cn/problems/shu-zu-zhong-shu-zi-chu-xian-de-ci-shu-lcof/)
::: tip
1. 两个相同的数异或值为0
2. 技巧7拿到最后一个不同的数
3. 将两个出现一次的数字分成两组
::: 

:::: code-group
::: code-group-item python
```python
import functools
from typing import *
class Solution:
    def singleNumbers(self, nums: List[int]) -> List[int]:
        ans = functools.reduce(lambda x, y:x^y, nums)
        ret = 1
        while ans & ret == 0:
            ret <<= 1
        x, y = 0, 0
        for num in nums:
            if num & ret:
                x ^= num
            else:
                y ^= num
        return [x, y]
```
:::
::: code-group-item golang
```golang
func singleNumbers(nums []int) []int {
	tmp := 0
	for _, num := range nums {
		tmp ^= num
	}
	mask := tmp & (-tmp)
	ans := make([]int, 2)
	for _, num := range nums {
		if mask&num == 0 {
			ans[0] ^= num
		} else {
			ans[1] ^= num
		}
	}
	return ans
}
```
:::
:::: 