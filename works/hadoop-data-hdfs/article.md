# 案例数据与技术查证｜审稿附录

[项目简报](brief.md) · [纯口播](配音稿.md) · [章纲与演出](章纲与演出.md)

## 交易站：六次投递怎样变成三笔有效收入

**自编教学数据。** Minecraft 生存服交易站设定为插件在扣款结束后写一条日志。它不是 Minecraft 的原生日志格式。一次交易以 `event_id` 标识，`amount_emeralds` 是该次应扣的整数颗数；只有 `SUCCESS` 才表示实收。`event_at` 是源事件时间，`received_at` 是采集端观测到的投递时间，均按 `Asia/Shanghai` 解释。下表为演算用的原始投递字段，不代表清洗后的表已经入库。

| 到达顺序 | `event_id` | `event_at`（2026 年） | `received_at`（2026 年） | `item` | `amount_emeralds` | `status` |
|---:|---|---|---|---|---:|---|
| 1 | T101 | 11-16 20:10 | 11-16 20:10 | 橡木 | 12 | `SUCCESS` |
| 2 | T102 | 11-16 20:12 | 11-16 20:12 | 圆石 | 8 | `SUCCESS` |
| 3 | T103 | 11-16 20:14 | 11-16 20:14 | 圆石 | 4 | `FAILED` |
| 4 | T104 | 11-16 20:16 | 11-16 20:16 | 橡木 | `?` | `SUCCESS` |
| 5 | T101 | 11-16 20:10 | 11-16 20:18 | 橡木 | 12 | `SUCCESS` |
| 6 | T105 | 11-16 23:58 | 11-17 00:02 | 橡木 | 6 | `SUCCESS` |

1. **获取：** 只演示采集器对 T101 的重读。集中的原始区保留每次投递。采集检查点指源文件身份与已提交到原始区的读取位置；演示暂停在「该位置的一批数据已持久化，尚未更新检查点」。恢复时假设源日志仍保留，因此可能重复到达。别把「先落盘再记进度」说成不会漏、不会重的保证。
2. **解析和校验：** 要有合法的事件编号、可解析的时间、已知货物、正整数应扣额和已知状态。T104 应扣额不是整数，隔离原文并标原因；不能填零，也不能当作失败交易。
3. **去重：** T101 的源载荷相同，第二次只有投递时间不同，清洗结果保留一条；原始区仍保留两次投递。编号不同即使金额相同也不能合并；同编号且源载荷冲突则交核查，本样例未引入冲突行。
4. **按事件日期归档：** 清洗后的四条有效记录都落在 `dt=2026-11-16`（也包括作为排查依据的失败事件 T103）；T105 不是十七日成交。若在 T105 到达前已发布，按相同逻辑重算并替换十六日结果，不把新结果追加到旧计数上。示意：可用收入从 `2 笔 / 20 颗` 更新到 `3 笔 / 26 颗`，两次发布都标记 `1 条待核`。
5. **验算：** 六次投递 = 三条有效成功 + 一条有效失败 + 一条重复 + 一条隔离。有效收入是橡木 `12 + 6 = 18`（两笔）、圆石 `8`（一笔），合计三笔、二十六颗；T103 的 `4` 是应扣额，不是收入。这个结果只覆盖已校验通过的记录。

## 存储推演：同一结构，分别看小样例和规模化文件

- 原始：`/warehouse/raw/trades/ingest_dt=2026-11-16/`、`ingest_dt=2026-11-17/`。原始区按采集日期举例，第二个日期只涉及晚到的 T105。
- 有效明细：`/warehouse/curated/trades/dt=2026-11-16/part-000.parquet`。按事件日期组织。筛目录是处理程序的选择；Parquet 列读取是文件读取器的能力，不是 HDFS 做 SQL。
- 隔离：`/warehouse/quarantine/trades/`，留原文与错误原因。这三个目录是示例组织方式，不是 HDFS 内置层级；统计由处理程序完成。
- **大文件只用于演算。** 同一结构的规模化明细假设有一个 `part-large.parquet`，大小 `300 MiB`；不是小表的四条记录真实生成了 300 MiB。块大小 `128 MiB = 134217728` 字节；逻辑块 `B1 / B2 / B3` 只是教学代号，大小 `128 / 128 / 44 MiB`。假定为常规复制、目标因子 `3`，并且目标副本均就绪：三个逻辑块、九份块副本、约 `900 MiB` 数据字节，不计校验和或其他开销。块大小和副本因子可配置；这里不讲纠删码。
- **跟第二块 B2，不追三条路线。** 例中客户端在机架一，甲、丁在机架一，乙、丙在机架二。一次符合场景的放置结果为甲、乙、丙存 B2；不是规定第几个副本总要去哪台。客户端给甲发送 B2 的数据包，甲传乙、乙传丙；健康管线下 ACK 反向逐跳返回。读时示例先取较近可用的甲。甲超时后，B2 还可从乙或丙读，NameNode 安排乙复制给丁，健康副本数 `3 → 2 → 3`。只画 B2；讨论完整文件可读时，须假定 B1 和 B3 也各有可读副本。
- **别混三类故障。** 字节损坏可由校验发现；节点不可用可能造成某块副本低于目标数；NameNode 故障影响元数据服务。各自用别的可读副本、重新复制、已配置的 NameNode HA 处理，不互相替代。全副本丢失不能从零补回，副本也不是独立备份。

## 已核的外部依据

| 口播关键说法 | 依据（Apache 官方） | 适用范围 / 不外推 |
|---|---|---|
| NameNode 管文件命名空间、块映射和位置，DataNode 提供块读写；HDFS 适合大文件及高吞吐读取 | [Hadoop 3.3.6 · HDFS Architecture](https://hadoop.apache.org/docs/r3.3.6/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html)，`Assumptions and Goals`、`NameNode and DataNodes`、`File System Metadata` | NameNode 内存中管理命名空间和块映射，小文件多会增加元数据规模；不把目录分区当作 HDFS 的分析能力，也不说文件数据经过 NameNode。 |
| 新文件块大小可配置；使用 `128 MiB` 和三副本演算 | [Hadoop 3.3.6 · hdfs-default.xml](https://hadoop.apache.org/docs/r3.3.6/hadoop-project-dist/hadoop-hdfs/hdfs-default.xml)，`dfs.blocksize`、`dfs.replication`；[HDFS Architecture](https://hadoop.apache.org/docs/r3.3.6/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html)，`Data Blocks`、`Data Replication` | `128 + 128 + 44 = 300`、`300 × 3 = 900` 是上述条件下的计算，不是实测磁盘占用。 |
| 写入有数据管线和反向确认；读优先较近副本，校验失败可尝试别的副本 | [HDFS Architecture](https://hadoop.apache.org/docs/r3.3.6/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html)，`Replication Pipelining`、`Replica Selection`、`Data Integrity`；[3.3.6 源码 BlockReceiver.java](https://github.com/apache/hadoop/blob/rel/release-3.3.6/hadoop-hdfs-project/hadoop-hdfs/src/main/java/org/apache/hadoop/hdfs/server/datanode/BlockReceiver.java)，`PacketResponder` 的下游 `readFields` 和 `sendAckUpstream` | 图示是正常写管线的一次确认，不表示单个包的 ACK 就完成了整文件写入，也不承诺每次都读本机。 |
| 心跳和块报告作用不同；失联后可重复制；放置可考虑机架 | [HDFS Architecture](https://hadoop.apache.org/docs/r3.3.6/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html)，`Data Replication`、`Replica Placement`、`Data Disk Failure, Heartbeats and Re-Replication` | 超时、放置和重复制都受配置、容量及集群状态影响；不因单次心跳错过就立即判死。 |
| Active/Standby 借共享编辑日志同步命名空间；Secondary NameNode 做检查点而非故障接管 | [Hadoop 3.3.6 · HDFS High Availability Using the Quorum Journal Manager](https://hadoop.apache.org/docs/r3.3.6/hadoop-project-dist/hadoop-hdfs/HDFSHighAvailabilityWithQJM.html)，`Architecture`；[HDFS Users Guide](https://hadoop.apache.org/docs/r3.3.6/hadoop-project-dist/hadoop-hdfs/HdfsUserGuide.html)，`Secondary NameNode` | 只讲已配置的 QJM 方案。Active 把编辑记录写到多数 JournalNode，Standby 读取并应用日志，满足条件后接管；不承诺零中断，不把 Secondary NameNode 接进 HA 图。 |
| Parquet 是列式文件格式，适合按需读列 | [Apache Parquet · Motivation](https://parquet.apache.org/docs/overview/motivation/) | 需要支持的读取器；不承诺任意查询或任意体量都更快。 |

采集检查点、隔离、去重和晚到补算是这个案例的数据管道约定，不归给 Hadoop 的某个默认工具。当前没有运行 Hadoop 集群；本稿的统计和副本数是可以手算对照的教学推演。
