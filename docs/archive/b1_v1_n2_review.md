# Supplementary Information
- The document name "b1_v1_n2_review.md" means that it is a review for node 2 in the first version of branch 1(which is the branch feat/markdown-integration here) in MD format. Other documents should be named similarly.

# Review
- [Agreement] The current developing stage is branch 1, version 1, inherited form main, version 3. 
- [Agreement] Regard the file ./sandbox/BRANCHES.md as the test MD document anchor. We can call it "anchor" for short. We call the branchfold MD renderer the "renderer". 
- [Requirement] Answer the following questions: 
  - Should we use cache rather than edit the MD file directly? If true, what kind of file format should we choose for the cache? Json? Where should the cache be stored if so? If not, why? 
  - How to choose from the following solutions/protocals(These categories below are not a strict partition: they are neither mutually exclusive nor exhaustive.): 
    - All the " - [ ] " style lines are rendered, while other texts: 
      - Directly abandoned in the renderer
      - Still rendered, but:  
        - Deliberately de-emphasized.
        - Normally emphasized.
        - Rendered at the bottom of the page, grouped together.
        - Rendered at the left or right side of the page
        - Folded between the cells of tasks.
        - Add an option to switch between the concise and the detailed mode. 
    - Design other clever rendering strategies.
    - Only render the strictly formatted MD file.
- [Agreement] As has been said before, archiving a document means extracting information useful for further implementation and save it in some relatively long term document in ./docs and then move them to the ./docs/archive folder. This is a convention. Do not archive this review right now. 

- [Next] ("Next" means that this is a node that needs additional request before continue on) Design a flexible and extendable branchfold format based on MD, which corresponds to the N2-3. 

# Output

1. Answered questions saved as: "b1_v1_n2_review-r1_questions.md"
2. A designed MD-based format named as: "b1_v1_n2_design_renderer.md" (Request before implementing)

