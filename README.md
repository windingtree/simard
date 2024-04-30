# Simard

Simard is a set of tools created to simplify and normalize the complex interfaces of airlines, hotels (shopping, pricing, booking) and payment systems to make them more easily accessible to buyers. These tools were created, tested and proven as part of the initiative to bring the Winding Tree tech stack to corporate travel and serve as a shortcut for any buyer (corporate or otherwise) seeking to connect to travel suppliers easily and quickly.

## Motivation

Simard is an attempt by Winding Tree to find a product-market fit. It takes into account the fact that controlling a crypto wallet is still quite a cumbersome process. In addition to that, if done incorrectly, it could lead to loss of data and assets. We all hope that soon there will be wallets that will be as user-friendly as any centralized software; in the meantime, we had to work out a solution that would generate revenue while using some of the decentralized infrastructure we'd created.

A traditional marketplace in travel is, essentially, a list of verified buyers and sellers. In the decentralized Winding Tree approach anyone can access the list, get on the list, and prove to other market participants that they can be trusted to do business with. Winding Tree introduced a concept of an attestation that a company could obtain from a partner or an industry body (e.g. IATA). Instead of trying to create a two-sided marketplace from scratch ("chicken and egg" problem is notoriously hard to solve), Winding Tree decided to engage a relatively big buyer of travel as well as several suppliers, where Winding Tree would act as an intermediary (!) that provides the "trust" utilizing ORGiD (decentralized identity for companies). This, of course, is supposed to be just a stepping stone to achieve full decentralization in the future.

## High Level Overview

Let's consider a following setup:

- There is a big buyer of travel that has its own travel booking interface for its employees; it has an ORGiD profile with an attestation from Winding Tree of their credibility
- There are several suppliers (airlines and hotels), each with their own ORGiD profile and attestations from Winding Tree
- Buyer's software "talks" to APIs of one or more suppliers, all API calls (and responses) are cryptographically signed to link them to their corresponding ORGiD profiles

## Problems (that Simard solves)

- All airlines have different APIs (and different business logic)
- Hotels do not provide APIs at all (only a few chains do)
- Suppliers ~~only~~ mostly care about getting paid on time

## Simard Components

- NDC Poxy - middleware for airline integrations
- Derbysoft Proxy - middleware for hotel integrations (uses Derbysoft)
- Simard Pay - a novel B2B payment processing tool; its main feature is called the "payment guarantee" which ensures that suppliers get paid on time

# Note on Decentralization

While Simard Pay is built in a way that could be entirely replaced by a smart contract, NDC and Derbysoft Proxies are not "decentralizeable." OTAs will have to run their own versions of Simard software (or custom built analogs).

## Contributors

- [Tomasz Kurek](https://github.com/tomashq)
- [Mathieu Tahon](https://github.com/mtahon)
- [David Okanlawon](https://github.com/dave-ok)
