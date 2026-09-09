import {PixelRing} from './ring-pixel.js';
export async function createRing(canvas){const ring=new PixelRing(canvas);await ring.load();return ring;}
