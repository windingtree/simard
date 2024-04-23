
// Determine the AC NDC System ID
import {env} from '../../env';

export const getACSystemId = (isPCI) => {
  if (env.isTest) {
    return (isPCI ? 'DEV-PCI' : 'DEV');
  } else {
    return (isPCI ? 'PROD-PCI' : 'PROD');
  }
};

// Convert the given formatted object to the XML form
export const convertObjectToXML = (data: any): any => Object.entries(JSON.parse(JSON.stringify(data))).map(p => {
  const props = [];
  let value;

  // Assign value defined as property to the tag
  if (p[0] === '@value') {
    return p[1];
  }

  if (Array.isArray(p[1])) {
    // Converting the array
    const values = p[1].map(
      a => typeof a === 'string'
        ? convertObjectToXML({
          [p[0]]: {
            '@value': a,
          },
        }).join('')
        : convertObjectToXML({
          [p[0]]: a,
        }).join('')
    );
    value = values.join('');
  } else if (typeof p[1] === 'object') {
    let propValue;
    const nextLevel = Object.entries(p[1]);

    // Looking for tag properties on the next level
    nextLevel.forEach(v => {
      if (v[0].match(/^@{1}/) && !v[0].match(/^@value/)) {
        props.push(`${v[0].split('@')[1]}="${v[1]}"`);
        delete p[1][v[0]]; // remove the property from the next level
      }
      if (v[0].match(/^@value/)) {
        propValue = true;
      }
    });

    // Converting the next level
    value = propValue
      ? convertObjectToXML(p[1]).join('')
      : convertObjectToXML(p[1]).join('');
  } else {
    value = p[1];
  }

  let result;

  if (Array.isArray(p[1])) {
    result = String(value);
  } else {
    // Create tag with properties
    const tag = `${p[0]}${props.length > 0 ? ' ' + props.join(' ') : ''}`;
    result = String(value ? value : '').trim()
      ? `<${tag}>${value}</${p[0]}>`
      : `<${tag} />`;
  }

  return result;
});
