---
title: k8s 使用小tip
date: 2022-01-03
tags:
 - kubernetes
 - k8s
 - 云原生
 - 容器编排
 - ingress
 - 运维技巧
 - 中级
 - 问题解决
categories:
 - 云原生
sidebar: auto
---

::: tip  
可以用dig查看dns解析是否成功  
`kubectl run dig --rm -it --image=rickiechina/dig --overrides='{"spec": {"nodeSelector": { "kubernetes.io/hostname": "k3s-worker1" }}}' -- /bin/sh`  
用curl查看目标服务是否可访问  
`kubectl run curl --rm -it --image=curlimages/curl --overrides='{"spec": {"nodeSelector": { "name": "value" }}}' --namespace=default -- /bin/sh`  
:::

