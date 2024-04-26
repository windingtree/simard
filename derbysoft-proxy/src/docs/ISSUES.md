# ISSUES

This is a document listing issues and challenges faced, including their current status and if there are any solutions, \
workarounds or proposals for them. An issue status could be one of: `unresolved`, `fixed`, `workaround`. 

- ## Content API - XML to typescript conversion and OTA types package
  ### Status - workaround

  There is a type mismatch issue in some types imported from the `ota-types` package. The `Emails` list element has an `Email`  \
  element which is improperly converted to string but should be an object with a `$value` and `attributes` property. Strangely, this \  
  only occurs when the `email` has an attribute. Otherwise, the `Email` element is received as a string in `node-soap`. This seems to be an issue  \
  with the `xml-to-typescript` converter in use and also `node-soap` not being consistent with parsing the WSDL file (an existing issue on Github will be linked here).

  ### Workaround
  Conversion bugs are handled on a per-case basis as listed below:
   - An appropriate `EmailElement` type is explicitly defined locally and the `email` field is converted to an `EmailElement` object within the `extractEmail` method.

- ## Content API Service - outdated axios package in node-soap
  ### Status - workaround

  `node-soap` uses an old version of axios internally. There is a type mismatch between the `AxiosConfig` interface in the current version of  \
  `axios` and the one used by node-soap. 

  ### Workaround
  In `DerbysoftContentService.ts`, the axios package from `node-soap` is used instead of the locally installed version.




