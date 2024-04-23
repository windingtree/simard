#!/usr/bin/bash

#this is a sample script to generate valid keys (private + pub) that can be used to sign JWT token
openssl ecparam -name secp256k1 -genkey -noout -out secp256k1.pem
openssl ec -in secp256k1.pem -pubout -out secp256k1.pub
