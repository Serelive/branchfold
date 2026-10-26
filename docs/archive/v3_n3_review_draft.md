# Review Draft for version 3 Node 3

This is the current result. 
It might work under certain situations, 
like one single project, urgent situation. 
But I think I won't use it as a long-term planning and execution system. 

General feelings:
1. (Very subjective opinion) Webs seems to be "unstable". 
2. No archive function.
3. I still do not know what to do. 
4. The prototype has nothing to do with deliverables.

## Brainstorm
I want a more fluid interface. It's hard for me to describe it in English, so I will use Chinese instead. 

想象我们把所有根拿出来, 并排上下排列, 并把他们卷成一个滚轮. 每个根对应一个单点项目, 其中有一个是新建根. 
我们可以上下滑动这个滚轮来选择任务, 点击一个滚轮, 其他的根节点全部消失, 只剩下这个cell在最左侧, 这是一个聚焦过程. 
这样就进入了一个tree. 
(虽说没太大用处, 但如果每个根都是彩色的, 看起来应该会很好看?)
或者我们干脆这样: All in one tree? 
只有一个root, 几个一级节点 life, work, study...

这样有点 "想做的太多了" 的感觉. 我们不是做那么泛用的东西. 前面的滚轮也是, 或许一个任务建一棵树就非常好. 我们做不做多任务? 

如果我们不把之前的创建和执行算法实装, task tree 似乎没有比基本 md 更有用的东西. 

最右侧的交付物还没有体现, 需要把这个专门设计出来吗? 
设置一个交付物模式? 
如果每个节点叶子都变成某种意义上的交付物, 那交付物本身是不是也能形成树状结构? 一个和任务树倒过来长的树? 
或者交付物树是任务树的影子? 仍然同方向? 

创建过程怎样体现在UI中呢? 只给我们原型的界面, 似乎怎么用它完全是用户自行决定的. 我们只是做一个工具, 每个人都会循着自己的使用习惯来做. 
人的思维似乎具有惰性, 很容易避重就轻, 只做自己擅长的, 真正困难的依旧成为阻力. 
我们要诱导用户吗? 
这似乎是一个悖论, 如果我们的工具需要已经能克服惰性了的用户来使用, 那它究竟有什么用? 

或者我们可以设计一种松散模式? 
这时候, 任务形成一种松散结构, 同一个父亲的子节点能赋一个权重. 重要的分支, 从父节点到子节点的分支更粗一些. 有点像流量图. 
但真有用吗? 


我们应该专门确定每个任务单元的语法吗? 例如"动词 + 名词", 不允许输入名词? 然后把这些动词和名词分别高亮来便于快速阅读? 
或者动词可以变成单选题, 每种动作有一种颜色, 我们就能像搭彩色积木一样把树搞成五颜六色的? 
但这有用吗? 似乎没有太大用处.

我为什么大概率不会用长期这个原型(当前版本). 

- 单一任务树似乎往往和项目在一起, 而 MD 已经广泛应用, 例如 README.md. 维护一个独立的外部任务管理系统, 比起在项目内维护一个 MD 代价更高, 特别地, 不容易和 Agent 互动.
- 当前原型不适合以任务集群的形式出现, 根节点之间唯一的联系是彼此独立并行, 不容易形成长期结构. 可以追求长期结构, 例如将一些任务集合放在一起, 面临复杂的分类和维护成本. 
- 不确定性似乎不太能被树状结构直接把握. 我们的树状结构仅仅是一个细小的穿刺工具. 当我们真的拿到一个不确定任务时, 例如证明哥德巴赫猜想时, 从零开始的不确定性逐步确定化是极其艰难的任务.
  - 它不是说新建一个分支那么简单. 向哪里新建分支? 这不是树状结构或者一个工具能告诉我们的. 虽说我们的任务不是直接面向高强度不确定性开发, 但如果我们打着这个名号, 它至少应该提供一个从零开始处理一个项目的基本方法论, 并实际说明自己的结构是极其契合这种方法论的. 




Other small details:
1. The expansion button and checkbox can be merged with the draggable handles. Only 1 button, drag to change place, click to expand, double click to mark it as 'checked'. 
2. The right hand side three dots click-expand panel seems useless. When expanding, it will push the cells below so that they make space for it and this will change the layout before expansion. I think a more appropriate UI design is something like the chat apps. When the user swipe the cell to left, the options to this cell appears. Here, it might be: tapping an icon or a designed dark region on the far right triggers the cell to slide left, revealing available options. 

