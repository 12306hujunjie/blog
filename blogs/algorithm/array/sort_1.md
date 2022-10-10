---
title: 常用排序算法简析
date: 2022-03-01
tags:
 - algorithm
 - bubble-sort
categories: 
 - algorithm
sidebar: auto
---
### lowb三人组算法

#### 1.  冒泡排序
![动图演示](../../../.vuepress/public/bubbleSort.gif)
::: tip
如上，可以看到数字在相邻之间比较大小并不断交换,直到最大的数一直被交换到最后一位，这就是一轮交换，到最后一轮的时候只有一个数无需进行交换了，那么交换的总次数需要列表的长度-1  
随着毎轮交换，有序序区自右向左不断增加，需要循环的无序区则不断减少，直至最后一位，交换结束
:::

```python3 []
def bubble_sort(li):
    for i in range(len(li) - 1):   # 从第 0 趟开始，一共交换列表的长度 - 1趟，即到下标为列表的最后一个元素的前一个元素停止(range函数左开右闭)
        for j in range(len(li) - 1 - i):  # 第 0 趟的时候, 无序区就是整个列表，j 为交换元素的指针
            if li[j] > li[j + 1]:    # 只有在该指针的后个元素小于当前指向的元素的时候才做交换
                li[j], li[j + 1] = li[j + 1], li[j]   交换两个元素的值
import random 
li = list(range(100))
random.shuffle(li)
print(li)
bubble_sort(li)
print(li)
```
``` golang []
func bubbleSort(li []int) []int{
    for i:=0;i<len(li)-1;i++{
        for j:=0;j<len(li)-1-i;j++{
            if li[j] > li[j+1] {
                li[j], li[j+1] = li[j+1], li[j]
            }
        }
    }
    return li
}

```

#### 2. 插入排序


```python3
def insert_sort(li):
    for i in range(len(li) - 1): # 遍历无序区
        j = i - 1                # 有序区从-1开始，也就是第一张牌
        tmp = li[i]              # 保存一下当前遍历的这个数，
        while j >= 0  and li[j] > tmp:
            li[j+1] = li[j]
            j -= 1
        li[j + 1] = tmp
```



