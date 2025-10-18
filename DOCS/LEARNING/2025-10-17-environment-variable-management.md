# Learning: Environment Variable Management in Go

**Date**: 2025-10-17
**Context**: Understanding how the `getEnv()` function works in the config package to safely retrieve environment variables with fallback values
**Difficulty Level**: Beginner

---

## 🎯 What We Built

We implemented a simple but powerful utility function that retrieves environment variables from the system with a safety net. This function ensures our application always has valid configuration values, even when environment variables aren't set. It's used throughout the Go backend to load API keys, database URLs, and other configuration settings.

The `getEnv()` function is a cornerstone of the application's configuration system, preventing crashes from missing environment variables and making local development easier with sensible defaults.

---

## 🧠 Core Concepts Explained

### Concept 1: Environment Variables

**The Story**:

Imagine your application is like a house that needs to know its address to receive mail. But this house is special - it lives in different neighborhoods (development, staging, production). Each neighborhood has a different address.

Environment variables are like sticky notes you put on the fridge that say "Our current address is: 123 Main St" - they tell the application important information about where it's running and how it should behave. You change the sticky note depending on which neighborhood you're in.

**Technical Reality**:

Environment variables are key-value pairs stored in the operating system's environment. In Go, we access them using `os.Getenv(key)`. They're loaded when the application starts and provide configuration without hardcoding values into the source code.

```go
// Accessing an environment variable
apiKey := os.Getenv("OPENAI_API_KEY")
// apiKey might be "sk-abc123..." or "" (empty string) if not set
```

**Why It Matters**:

Environment variables allow us to:
1. **Keep secrets out of source code** - API keys never get committed to git
2. **Use different configs per environment** - dev database vs production database
3. **Deploy the same code everywhere** - only the environment changes, not the code
4. **Follow the 12-Factor App methodology** - a best practice for modern applications

**Code Example**:

```go
// Without environment variables (BAD - hardcoded secret!)
apiKey := "sk-abc123secretkey456"

// With environment variables (GOOD - configurable and secure)
apiKey := os.Getenv("OPENAI_API_KEY")
```

---

### Concept 2: Fallback Values

**The Story**:

Think of fallback values like having a spare key under the doormat. If you forget your main key (the environment variable isn't set), you can still get inside the house (the application can still run) using the spare key (the fallback value).

This is especially useful during development. You don't want to set up 10 different environment variables just to try out the code - the fallback values let you get started quickly, and you only need to set environment variables when you're ready to use real services.

**Technical Reality**:

A fallback value is a default that's used when `os.Getenv()` returns an empty string. This happens when the environment variable doesn't exist or hasn't been set.

```go
func getEnv(key, fallback string) string {
    if value := os.Getenv(key); value != "" {
        return value  // Use the environment variable if it exists
    }
    return fallback   // Otherwise, use the fallback
}
```

**Why It Matters**:

Fallback values provide:
1. **Graceful degradation** - app works even with missing config
2. **Developer-friendly defaults** - local development "just works"
3. **Clear documentation** - the fallback shows what the expected value looks like
4. **Reduced setup friction** - new developers can run the app immediately

**Code Example**:

```go
// Set the port with a sensible fallback
port := getEnv("PORT", "8080")
// If PORT environment variable exists, use it
// Otherwise, use "8080" as the default

// This means the app will always listen on some port
// Developers don't need to set PORT locally
// But in production, we can override it with environment variables
```

---

### Concept 3: The `:=` Short Variable Declaration

**The Story**:

Imagine you're in a workshop building something. The `:=` operator is like reaching for a new empty toolbox (creating a new variable) and immediately putting a tool in it (assigning a value) - all in one smooth motion.

It's Go's way of saying "I need a new variable right here, right now, with this value" without all the ceremony of traditional variable declarations.

**Technical Reality**:

The `:=` operator does two things at once:
1. Declares a new variable (figures out its type automatically)
2. Assigns a value to it

```go
// Traditional way (verbose)
var value string
value = os.Getenv(key)

// Short declaration (concise)
value := os.Getenv(key)
```

**Why It Matters**:

The short declaration operator:
1. **Reduces boilerplate** - less code to write and read
2. **Automatic type inference** - Go figures out the type for you
3. **Scoped correctly** - variable only exists where you need it
4. **Idiomatic Go** - this is the "Go way" of declaring variables

**Code Example**:

```go
func getEnv(key, fallback string) string {
    // The 'if' statement creates a new variable 'value' that only exists
    // inside this if block - perfect for a quick check
    if value := os.Getenv(key); value != "" {
        // 'value' is available here
        return value
    }
    // 'value' doesn't exist here anymore - it was scoped to the if block
    return fallback
}
```

---

## 🔄 How It All Connects

Here's the complete journey of retrieving a configuration value:

```
┌─────────────────────────────────────────────┐
│  Application starts up                      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Need configuration value (e.g., API key)   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Call getEnv("OPENAI_API_KEY", "")          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Look for OPENAI_API_KEY in environment     │
└────────────────┬────────────────────────────┘
                 │
          ┌──────┴──────┐
          │             │
          ▼             ▼
    ┌─────────┐   ┌─────────┐
    │ Found!  │   │Not found│
    │ (value) │   │ (empty) │
    └────┬────┘   └────┬────┘
         │             │
         │             ▼
         │        ┌─────────┐
         │        │ Return  │
         │        │fallback │
         │        └────┬────┘
         │             │
         └─────┬───────┘
               ▼
        ┌──────────────┐
        │ Use the value│
        │in application│
        └──────────────┘
```

The function creates a safety net: try to get the real value, but if it's not there, use a backup. This pattern is used throughout the codebase in [apps/api/config/config.go:41-46](apps/api/config/config.go#L41-L46) to load all configuration settings.

---

## 💡 Key Takeaways

1. **Environment variables are the source of truth for configuration**: They allow the same code to run in different environments with different settings, keeping secrets out of source code.

2. **Fallback values make development easier**: By providing sensible defaults, developers can run the application locally without complex setup, while production environments can override with actual values.

3. **Go's short declaration syntax (`:=`) is powerful and concise**: It combines variable declaration and assignment, with automatic type inference, making code more readable and idiomatic.

---

## 🚀 Try It Yourself

**Challenge**:

Create a new configuration value for a "maximum retry attempts" setting. It should:
- Read from an environment variable called `MAX_RETRIES`
- Default to `"3"` if not set
- Be used in a hypothetical retry function

**Solution Hints**:

1. Use the same `getEnv()` function pattern we learned about
2. Remember that `getEnv()` returns a string - you may need to convert it to an integer for actual use
3. The `strconv.Atoi()` function can convert strings to integers in Go

Try implementing this before looking at the answer below!

<details>
<summary>Click to see solution</summary>

```go
import (
    "strconv"
    "log"
)

func getMaxRetries() int {
    maxRetriesStr := getEnv("MAX_RETRIES", "3")
    maxRetries, err := strconv.Atoi(maxRetriesStr)
    if err != nil {
        log.Printf("Invalid MAX_RETRIES value, using default: 3")
        return 3
    }
    return maxRetries
}

// Usage
func retryOperation() {
    maxRetries := getMaxRetries()
    for i := 0; i < maxRetries; i++ {
        // Try the operation
    }
}
```

</details>

---

## 📚 Further Reading

### Related Documentation in This Codebase
- [Full config package](apps/api/config/config.go) - See how `getEnv()` is used throughout
- [Environment variables guide](CLAUDE.md#L64-L72) - List of all environment variables needed

### External Resources
- [12-Factor App Config](https://12factor.net/config) - Best practices for app configuration
- [Go os package documentation](https://pkg.go.dev/os#Getenv) - Official docs for `os.Getenv()`
- [Go by Example: Environment Variables](https://gobyexample.com/environment-variables) - Practical examples

### Related Concepts to Explore Next
- Type conversion in Go (`strconv` package)
- Error handling patterns in configuration
- Configuration validation and required vs optional values
- Using `.env` files in local development

---

## ❓ Questions for Reflection

1. **Why use environment variables instead of a config file?**:
   Think about security, version control, and the ability to change configuration without rebuilding the application. What are the trade-offs?

2. **What happens if a critical environment variable is missing and we use an empty string as the fallback?**:
   Consider the `getEnv("OPENAI_API_KEY", "")` example. If the environment variable isn't set, we get an empty string. How should the application handle this? Should it crash early or fail later when trying to make API calls?

3. **Could we make this more type-safe?**:
   Currently, `getEnv()` only works with strings. What if we wanted an `getEnvInt()` or `getEnvBool()` that returns the appropriate type? How would you design that?

4. **When should we use fallback values vs. required values?**:
   Some settings (like database URLs in production) should be required and cause the app to crash if missing. Others (like feature flags) can have reasonable defaults. How do you decide which is which?

---

## 🤔 Common Questions

### Q: Why return an empty string `""` as a fallback for API keys instead of a placeholder like `"your-key-here"`?

A: Empty strings are better because they fail fast. If you accidentally try to use an empty string as an API key, you'll get an immediate authentication error. A placeholder might look valid at first glance but still fail, making debugging harder. Plus, the code that uses the API key can check `if apiKey == "" { ... }` to detect missing configuration.

### Q: What's the difference between `var x = value` and `x := value`?

A: They're almost identical in most cases:
- `var x = value` can be used at package level (outside functions)
- `x := value` can only be used inside functions
- Both automatically infer the type from the value
- Use `:=` inside functions (idiomatic Go), use `var` at package level

### Q: Can I set environment variables from within my Go program?

A: Yes! Use `os.Setenv("KEY", "value")`, but it's rarely needed. Environment variables are usually set outside the program (by the shell, container orchestrator, or deployment platform). Setting them in code defeats the purpose of external configuration.

---

**Next Steps**:
- Look at how [apps/api/config/config.go](apps/api/config/config.go) uses `getEnv()` to load multiple configuration values
- Try adding a new environment variable to your local setup and use it in the application
- Explore how Docker Compose and deployment platforms inject environment variables
