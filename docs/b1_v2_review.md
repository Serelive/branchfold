# Review for branch 1, version 2, node2-3

- **[Agreement]** Let's use the structured parts to refer to the " - [ ] " style structures, and the unstructured parts for the other texts. 
- **[Agreement]** Do not regard the web as a renderer; regard it as an external "import-edit-export" tool. After importing, the raw file has nothing to do with the task tree in the web. 
- **[Requirement]** Refactor the web's UI. 
     - Decompose "Open Markdown view" as export and import options simlilar to json. 
        - When importing, only import the structured parts, abandon all the unstructured part; stop implementing the concise / detailed mode. After importing, the tree imported from MD or json should be treated uniformly. When exporting, export in a standard and recognizable MD format.  
    - Make the "Directory guides", "Ancestor titles", "Leaf drawings" mode the default. 
    - Make another import option to distinguish the append-like and override-like import. 
- **[Requirement]** Refactor the extension's UI
  - Make the extension's UI consistent with the web. 
  - Continue to Implement the basic editing methods in the editor. 
  - Use "import-edit-save" method, the conventional editor solution. Renaming or other basic editing methods will not modify the file directly before saving. 
  - Refresh automatically. 
  - When importing, only import the structured parts, abandon all the unstructured part; stop implementing the concise / detailed mode. After importing, the tree imported from MD or json should be treated uniformly. When exporting, export in a standard and recognizable MD format.
 - **[Requirment]** Archive this review and the previous report for b1_v2. 