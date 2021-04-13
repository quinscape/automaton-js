---
title: Automaton-Js Introduction 
date: 2021-04-09
---
<section>
# Introduction 

Automaton is a model-driven full-stack web application framework based on Spring Boot, GraphQL / DomainQL, React and MobX. 
It uses a process based state-system to run the application. 

</section>

<section>
## Why Automaton?
                            
We believe that model-driven, generated code can help a lot to provide a streamlined, consistent user-experience quickly. 

We have been using this approach for some time now with another system and we wrote automaton (and DomainQL) as a new 
platform for this code generation approach. We are currently using it to develop a new government side emission control
application for several German federal states.
                                
In contrast to the former system we opted for a smaller scale model approach and to keep the user-code as close to 
normal Javascript code as possible to have a target that is both easy to generate and attractive as a platform to write
code by hand for.

We have created a powerful system of abstraction and components that can be combined to build your application.

The architecture of an automaton application uses well established java standards in the service of a modern web application
structured in a way to support writing good and performant applications. 

</section>

<section>
## DomainQL

Automaton is the application framework around the core technology DomainQL drives the domain type logic and handles 
execution and conversions and all kinds of things.

<DomainQLDiagram/>
</section>





