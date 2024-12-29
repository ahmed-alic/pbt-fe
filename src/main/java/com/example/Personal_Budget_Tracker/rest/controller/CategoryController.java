package com.example.Personal_Budget_Tracker.rest.controller;

import com.example.Personal_Budget_Tracker.core.model.Category;
import com.example.Personal_Budget_Tracker.core.service.CategoryService;
import com.example.Personal_Budget_Tracker.core.api.categorysuggester.CategorySuggester;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/category")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CategoryController {
    private final CategoryService categoryService;
    private final CategorySuggester categorySuggester;

    public CategoryController(CategoryService categoryService, CategorySuggester categorySuggester) {
        this.categoryService = categoryService;
        this.categorySuggester = categorySuggester;
    }

    @GetMapping("/")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/create")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.createCategory(category));
    }

    @GetMapping("/suggest")
    public ResponseEntity<String> suggestCategory(@RequestParam String description) {
        try {
            System.out.println("Received suggestion request for description: " + description);
            String suggestedCategory = categorySuggester.suggestCategory(description);
            System.out.println("OpenAI suggested category: " + suggestedCategory);
            return ResponseEntity.ok(suggestedCategory);
        } catch (Exception e) {
            System.err.println("Error suggesting category: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to suggest category: " + e.getMessage());
        }
    }
}
