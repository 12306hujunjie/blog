---
title: Mermaid Debug Page
date: 2024-01-25
---

# Mermaid Debug Page

This page is for debugging Mermaid rendering. 

## Simple Test

```mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
```

## Debug Information

<script>
// Debug script that runs when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      console.log('=== Mermaid Debug Info ===');
      
      // Log all relevant elements
      const codeBlocks = document.querySelectorAll('div.language-mermaid pre code');
      const mermaidTags = document.querySelectorAll('mermaid');
      const containers = document.querySelectorAll('.mermaid-container');
      const svgs = document.querySelectorAll('.mermaid-container svg');
      
      console.log('Code blocks:', codeBlocks.length);
      console.log('Mermaid tags:', mermaidTags.length);  
      console.log('Containers:', containers.length);
      console.log('SVGs:', svgs.length);
      
      // Log content of first code block if any
      if (codeBlocks.length > 0) {
        console.log('First code block content:', codeBlocks[0].textContent);
      }
      
      // Try manual mermaid import
      import('mermaid').then(m => {
        console.log('Mermaid loaded successfully:', typeof m.default);
      }).catch(e => {
        console.error('Failed to load mermaid:', e);
      });
      
    }, 2000);
  });
}
</script>

**Instructions**: Open your browser's developer console (F12) to see debug information.