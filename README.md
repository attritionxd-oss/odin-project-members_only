# Project: Members Only

A simple messsaging board for an exclusive club, created as an implementation demonstrating authentication. It is build using Node.js, Express, EJS, PostgreSQL, and Passport (Local Strategy). This project serves as an implementation of [The Odin Project's Members Only assignment](https://www.theodinproject.com/lessons/node-path-nodejs-members-only).

## Key build dependencies

### Core

- **Node.js**
- **Express**
- **node-postgres**
- **express-validator**
- **Passport (Local Strategy)**

### Styling

- **EJS** — used in layouts & reusable templates
- **CSS** — vanilla CSS, scoped using [**Block, Element, Modifier** (BEM) naming methodology](https://bem.info/en/methodology/).

## Getting started

### Prerequisites

Make sure you have npm (^11.x) and Node.js (^24.x) installed on your machine.

### Installation

Clone the repository:

```sh
git clone git@github.com:attritionxd-oss/odin-project-members_only.git
cd odin-project-members_only
```

Install dependencies:

```sh
npm install
```

Create a local PostgreSQL database then configure a local `.env` file. See `.env.example` for the expected environment variables.

Run the schema and database seeding scripts:

```sh
npm run db:schema
npm run table:seed
```

Start the dev server:

```sh
npm run dev
```

## Acknowledgements

This project was build as part of [The Odin Project FullStack JavaScript Curriculum](https://www.theodinproject.com/paths/full-stack-javascript).

