---
title: 冒泡排序
date: 2022-03-01
tags:
 - algorithm
 - bubble-sort
categories: 
 - algorithm
sidebar: auto
---

# 冒泡排序
![动图演示](../../../.vuepress/public/bubbleSort.gif)


````python
def bubble_sort(input_array):
    for i in range(1, len(input_array)):
        for j in range(len(input_array) - i):
            if input_array[j] > input_array[j+1]
                input_array[j], input_array[j+1] = input_array[j+1], input_array[j]
    return input_array
````
