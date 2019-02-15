# Automaton-Js

The automaton-js contains common functionality of Automaton applications. It extends on the functionality of 
"domainq-form" and adds a set of standard concepts, directories and conventions making the underlying mobx/domainql 
application a better target for code generation tooling.

      
## Processes

The application is organized in processes, each process being a state-machine/UML-activity with named states and named 
transitions between them. 

Each named application can have multiple processes, the process that has the same name as the application is the main 
process which gets started when the application is started.   

## Standard-Layout

```bash
└── myapp
    ├── automaton-test.css
    ├── domain
    │   └── Foo.js
    ├── processes
    │   └── myapp
    │       ├── composites
    │       │   └── MyAppHome.js
    │       └── myapp.js
    ├── scopes.js
    └── myapp-startup.js

```

## Composites

WIP

## Scopes

WIP
