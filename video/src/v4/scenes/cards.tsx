import React from 'react';
import {hash} from '../fx/ease';
import {CardAt} from '../ui/cards';
import type {RainItem} from '../fx/Rain';

// Las tarjetas del caos y del muro: 36 instancias repartidas entre los tipos de la biblioteca, con variantes.
const COUNT = 32;

export const rainItems: RainItem[] = Array.from({length: COUNT}, (_, i) => {
  const variant = Math.floor(hash(i, 5) * 3);
  const {node, w, h} = CardAt({index: i, variant});
  return {w, h, node: <React.Fragment key={i}>{node}</React.Fragment>};
});
