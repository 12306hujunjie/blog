---
title: k3s(轻量级k8s)部署
date: 2022-01-03
tags:
 - k3s
 - 最佳实践
categories:
 - 云原生
sidebar: auto
---
## 一、准备工作
### 1. 先决条件
两个节点不能有相同的主机名。如果您的所有节点都有相同的主机名，请使用--with-node-id选项为每个节点添加一个随机后缀，或者为您添加到集群的每个节点设计一个独特的名称，用--node-name或$K3S_NODE_NAME传递。  
建议在一开始设置好所有节点的hostname,如`hostnamectl set-hostname master-node1`
### 2. 操作系统
K3s 有望在大多数现代 Linux 系统上运行。

有些操作系统有特定要求：

- 如果您使用的是Raspbian Buster，请按照[这些步骤](https://docs.rancher.cn/docs/k3s/advanced/_index/#%E5%9C%A8-raspbian-buster-%E4%B8%8A%E5%90%AF%E7%94%A8%E6%97%A7%E7%89%88%E7%9A%84-iptables)切换到传统的 iptables。
- 如果您使用的是Alpine Linux，请按照[这些步骤](https://docs.rancher.cn/docs/k3s/advanced/_index#alpine-linux-%E5%AE%89%E8%A3%85%E7%9A%84%E9%A2%9D%E5%A4%96%E5%87%86%E5%A4%87%E5%B7%A5%E4%BD%9C)进行额外设置。
- 如果您使用的是Red Hat/CentOS，请按照[这些步骤](https://docs.rancher.cn/docs/k3s/advanced/_index#Red-Hat-%E5%92%8C-CentOS-%E7%9A%84%E9%A2%9D%E5%A4%96%E5%87%86%E5%A4%87)进行额外设置。

### 3. CPU,内存和磁盘
最低要求`1c1g`的cpu和内存  
磁盘的性能决定了`k3s`的性能,建议使用ssd

### 4. 网络
K3s server 需要 6443 端口才能被所有节点访问。

当使用 Flannel VXLAN 时，节点需要能够通过 UDP 端口 8472 访问其他节点。节点不应该在其他端口上监听。K3s 使用反向隧道，这样节点与服务器建立出站连接，所有的 kubelet 流量都通过该隧道运行。然而，如果你不使用 Flannel 并提供自己的自定义 CNI，那么 K3s 就不需要 8472 端口。

如果要使用metrics server，则需要在每个节点上打开端口 10250 端口。

如果计划使用嵌入式 etcd 实现高可用性，则 server 节点必须在端口 2379 和 2380 上可以相互访问。

::: tip
节点上的 VXLAN 端口不应公开暴露，因为它公开了集群网络，任何人都可以访问它。应在禁止访问端口 8472 的防火墙/安全组后面运行节点。
:::
::: warning
Flannel 依靠 Bridge CNI plugin 来创建一个可以交换流量的 L2 网络。具有 NET_RAW 功能的 Rogue pod 可以滥用该 L2 网络来发动攻击，如 ARP 欺骗。因此，正如 kubernetes 文档中记载的那样，请设置一个受限配置文件，在不可信任的 pod 上禁用 NET_RAW。
:::

|协议|端口|源|描述|
|:-:|:-:|:-:|:-:|
|TCP|6443|K3s agent 节点|Kubernetes API Server|
|UDP|8472|K3s server 和 agent 节点|仅对 Flannel VXLAN 需要|
|TCP|10250|K3s server 和 agent 节点|Kubelet metrics|
|TCP|2379-2380|K3s server 节点|只有嵌入式 etcd 高可用才需要|

通常情况下，所有出站流量都是允许的。
## 二、快速安装
1. server 国内安装    
`curl -sfL http://rancher-mirror.cnrancher.com/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -`
2. server 国外安装    
`curl -sfL https://get.k3s.io | sh -`
3. worker 国内安装    
`curl -sfL http://rancher-mirror.cnrancher.com/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn K3S_URL=${K3S_URL} K3S_TOKEN=${K3S_TOKEN} sh -`
4. worker 国外安装    
`curl -sfL https://get.k3s.io | K3S_URL=${K3S_URL} K3S_TOKEN=${K3S_TOKEN} sh -`  

**notice**:    

- worker 安装前先export一下环境变量  
`export K3S_URL=https://{ip or domain}:6443`  
ps: 此处若想要api server高可用，可有三种方式
  1. 购买内网负载均衡解析到相关server节点端口
  2. DNS负载均衡解析
  3. VIP或者弹性ip
`export K3S_TOKEN=xxxxx::server:xxxxx`

- `K3S_TOKEN` 在server环境的`/var/lib/rancher/k3s/server/node-token`路径

- 每台计算机必须具有唯一的主机名。如果您的计算机没有唯一的主机名，请传递`K3S_NODE_NAME`环境变量，并为每个节点提供一个有效且唯一的主机名。
- [高可用安装](https://docs.rancher.cn/docs/k3s/installation/ha/_index)时可使用外部数据库 `--datastore-endpoint='mysql://user:pass@tcp(url:port)/database'`
- 由于k3sv2之后强制安装的traefik也升级到v2版本，与当前nginx ingress配置完全不兼容，本次选用指定版本, 安装前export一下环境变量`INSTALL_K3S_VERSION=v1.19.16+k3s1`

至此就完成了:tada:
