import type { Photo } from './types.ts';

// Every photo the app shows, with its author and licence (design/SOURCES.md has how each was read).
const IFIXIT = 'CC BY-NC-SA 3.0' as const;
const IPHONE = 'https://www.ifixit.com/Teardown/iPhone+13+Pro+Teardown/144928';
const GALAXY = 'https://www.ifixit.com/Teardown/Galaxy+S23+Teardown/158006';
const IDEAPAD = 'https://www.ifixit.com/Guide/Full+teardown.+Lenovo+IdeaPad+3-15IAU7+Lenovo+IdeaPad+3-15IAU7/176784';

export const PHOTOS = {
  iphoneParts: { file: 'photos/iphone13pro-parts.jpg', alt: 'An iPhone 13 Pro taken apart and laid out: the screen, the frame, the battery, the main board, the cameras and many small parts.', author: 'Tobias Isakeit', source: 'iFixit, iPhone 13 Pro Teardown', licence: IFIXIT, url: IPHONE },
  iphoneBoard: { file: 'photos/iphone13pro-board.jpg', alt: 'Fingers holding the small main board of an iPhone 13 Pro, with the A15 chip on it.', author: 'Tobias Isakeit', source: 'iFixit, iPhone 13 Pro Teardown', licence: IFIXIT, url: IPHONE },
  galaxyParts: { file: 'photos/galaxys23-parts.jpg', alt: 'A Samsung Galaxy S23 taken apart and laid out on a blue mat: the back glass, the cameras, the frame with the screen, the main board and the battery.', author: 'Andrea Alfani', source: 'iFixit, Galaxy S23 Teardown', licence: IFIXIT, url: GALAXY },
  galaxyBattery: { file: 'photos/galaxys23-battery.jpg', alt: 'The flat battery inside a Galaxy S23, being lifted out with a plastic tool.', author: 'Andrea Alfani', source: 'iFixit, Galaxy S23 Teardown', licence: IFIXIT, url: GALAXY },
  ideapadInside: { file: 'photos/ideapad3-inside.jpg', alt: 'A Lenovo IdeaPad 3 laptop with its bottom cover off: a fan on the left, a copper heat pipe across the middle, a long battery along the front, and small cards on the right.', author: 'DanielAdvancedDeviceRepair', source: 'iFixit, Full teardown. Lenovo IdeaPad 3-15IAU7', licence: IFIXIT, url: IDEAPAD },
  ideapadSsd: { file: 'photos/ideapad3-ssd.jpg', alt: 'The small M.2 SSD card inside a Lenovo IdeaPad 3, held down by one screw.', author: 'DanielAdvancedDeviceRepair', source: 'iFixit, Full teardown. Lenovo IdeaPad 3-15IAU7', licence: IFIXIT, url: IDEAPAD },
  ram: { file: 'photos/ram-ddr4.jpg', alt: 'A DDR4 RAM stick for a desktop computer, with a red cover and a row of gold contacts along the bottom.', author: 'ElooKoN', source: 'Wikimedia Commons, RAM Module (SDRAM-DDR4).jpg', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:RAM_Module_(SDRAM-DDR4).jpg' },
  cpu: { file: 'photos/cpu-i7-12700k.jpg', alt: 'An Intel Core i7 CPU seen from above: a silver metal lid on a green square board.', author: 'Eric Gaba', source: 'Wikimedia Commons, Intel CPU Core i7 12700K Alder Lake top.jpg', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Intel_CPU_Core_i7_12700K_Alder_Lake_top.jpg' },
  board: { file: 'photos/board-uatx.jpg', alt: 'A desktop motherboard seen from above: the CPU socket in the middle, four memory slots at the bottom, long slots on the left, ports along the top.', author: 'Smial', source: 'Wikimedia Commons, Gigabyte GA-H87M-D3H motherboard µATX', licence: 'Free Art License', url: 'https://commons.wikimedia.org/wiki/File:Gigabyte_GA-H87M-D3H_motherboard_%C2%B5ATX_with_Intel_Socket_1150.jpg' },
} satisfies Record<string, Photo>;

export const LICENCE_URL: Record<Photo['licence'], string> = {
  'CC BY-NC-SA 3.0': 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'Free Art License': 'https://artlibre.org/licence/lal/en/',
};
