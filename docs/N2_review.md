# Agreement in review: 
"Node x-y-z-...-w" means the node located in tree x, level-1 branch y, level-2 branch z, ... some level branch w(or leaf, if it's the branch of the last level).
For example, Node 1 means the first root and all its sons, which is the first tree. 

The short names should be like "Nx-y-z-...-w". The files with regard to Node x-y-z-...-w should be names following the rule "<Nx-y-z-...-w_><type><_keyword>.md", where <_keyword> can be omitted.
For example, the review for Node 2 should be named like "N2_review.md". 

However, since the Node for this repository is not fixed and therefore by no means a good identifier, the review is only for temporary use and the valuable parts should be decomposed and digested into relatively fixed documents in ./docs manually after reading. 

Or we can add automatically generated permanent IDs for nodes. This is an idea, not a requirement that should be instantly implemented and should be saved to some fixed documents mentioned above. 

# Review
This review is for Node 2. 

The website has been successfully run in the browser through http://127.0.0.1:5173/. 

Basic functions like adding new roots and children by clicking the icon, modifying the texts, mark tasks as "checked" using the box in front of the text have already passed.  

# Suggestions
1. \[Requirement\] You should commit automatically when a single modification is validly implemented, rather than only when explicitly requested. Also, do not commit only when the whole work is almost done. Modify this requirement in the AGENTS.md 
2. \[Requirement\] The BRANCHES.md is a living planning and execution system, which means you can modify it without requesting. It should be maintained by and for you rather than by or for the user. It is suggested to frequently modify it whenever you think any following tasks are not suitable to carry on or any new idea pops up. Modifying means creating, deleting, refactoring, extending, rather than only change [ ] to [x]. You should not modify it only when some tasks are completed. You should inspect and modify whenever a work round begins or ends. 
3. \[Suggest\] Node 2 should not be before Node 3, since the reordering, reparenting or deleting functions are basic requirements for the task tree to be flexible and indeed usable. Since the Node 2 has been Please reconstruct the BRANCHES.md. 
4. \[Requirement\] You shouldn't add supplementary information in the BRANCHES.md like validation or limits. If you want, you should decompose them in the task tree above. Now you can either delete them or merge them. Keep the forest lightweight.
5. \[Requirement\] Create long-term documents to collect valuable ideas of this review and then archive this review document. 