---
mode: agent
description: Creates a new issue on GitHub documenting a story that belongs to a feature.
---

# Create story outlines for a feature

Look at issue $ARGUMENTS on GitHub and analyze it to understand the structure of the feature.
Then generate rough outlines for a set of functionally oriented user stories to implement
the feature in the software. Create the user stories using the `.github/ISSUE_TEMPLATE/story.md` template.

## What could be a valid user story

- The story follows the INVEST principles
- In case the story adds on to a previous story it should provide a clear extra horizontal layer of functionality to improve the previous story.
- In case the story is completely new, I expect that the story implements user functionality

## User story guidelines

- Use a nice short title for the user story so it is easy to find on the GitHub backlog
- Use the "As a <role>, I want <feature>, so that <value>" style description for the story description
- Leave out acceptance criteria, technical requirements, and other details for now
