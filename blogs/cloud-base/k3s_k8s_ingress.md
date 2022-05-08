---
title: k8s 和 k3s 入口流量分析
date: 2022-01-03
tags:
 - k8s
 - best-practice
 - k8s-from-scratch
categories:
 - cloud-base
sidebar: auto
---


::: tip  
可以用dig查看dns解析是否成功  
`kubectl run dig --rm -it --image=rickiechina/dig --overrides='{"spec": {"nodeSelector": { "kubernetes.io/hostname": "k3s-worker1" }}}' -- /bin/sh`  
用curl查看目标服务是否可访问  
`kubectl run curl --rm -it --image=curlimages/curl --overrides='{"spec": {"nodeSelector": { "name": "value" }}}' --namespace=default -- /bin/sh`  
:::

