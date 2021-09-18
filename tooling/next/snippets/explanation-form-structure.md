---
title: "Form Design in domainql-form"
date: "2021-9-16"
---

<section>
# Form Design in domainql-form

This document goes deeper into the high-level design aspects of domainql-form. How I initially envisioned them to work and how they evolved over time driven by our experiences with it.
</section>

<section>

## First concept

The first concept was really simple. We have a MobX domain object that represents the root object for the part of the domain we manage with the form, and then we have the _<Form/>_ componen>

The _<Field/>_ components reference paths within the object graph by lodash like paths. Here for our example _"owner.name"_, which first references the owner object that is embedded as prop>

I mostly imagined one big _<Form/>_ component per view.

[![Diagram showing the initially envisioned connection between the Form component and MobX domain object.](/media/form-1.png)]

This works and for large parts still works this way, but over time we slowly evolved into a more complex model.
</section>

<section>
### Problem: HTML

The first thing that became on issue was the of course well-known fact that you can't nest forms within _HTML_. And at first it seems like, duh, who would do something like that? But then y>
</section>

<section>

### Problem: Awkard forms

While in some cases it is just natural to have sub-ordinate objects connected in the form and to edit fields within those, but as soon as you get to lists or deeply nested property paths it>
</section>

<section>

## Solution: Many Forms Paradigm

So we obviously need to be able to have many forms, often referencing the same object. But we also have cases where we want to edit the nth element out of a list of associated entities.

The form components now point anywhere they like. One root object, many root objects, objects within root objects, doesn't matter.

[![Diagram showing the new "Many Forms" approach ](/media/form-2.png)]

We just have many forms that write into the same (non-isolated) objects. These _<Form/>_ components all have their own _<form/>_ elements. But what we want most of the time is that the form>

If the user has entered erroneous data and there is an error displayed, all non-discarding buttons must be disabled. Only things like _"Cancel"_ can remain enabled.
</section>

<section>

## FormContext

This orchestration of _<Form/>_ component functionality is handled by the new FormContext class. There is a default context that is always used unless the application author created and ref>

The FormContext also registers all available memoized field-contexts which can be used to implement high-level form behavior on top of domainql-form.
</section>

