/*
This is a Optical-Character-Recognition program
Copyright (C) 2000-2010  Joerg Schulenburg

   The character codes in this file are Copyright (c) 1991-1999 Unicode, Inc.
   All Rights reserved.

   This file is provided as-is by Unicode, Inc. (The Unicode Consortium).
   No claims are made as to fitness for any particular purpose.  No
   warranties of any kind are expressed or implied.  The recipient
   agrees to determine applicability of information provided.  If this
   file has been provided on optical media by Unicode, Inc., the sole
   remedy for any claim will be exchange of defective media within 90
   days of receipt.

   Unicode, Inc. hereby grants the right to freely use the information
   supplied in this file in the creation of products supporting the
   Unicode Standard, and to make copies of this file in any form for
   internal or external distribution as long as this notice remains
   attached.

For the rest of the file, the following applies:

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.

 see README for EMAIL-address
 */
 
#ifndef G_UNICODE_H
#define G_UNICODE_H

#include <stddef.h>

enum format {
	ISO8859_1, TeX, HTML, XML, SGML, UTF8, ASCII
};
typedef enum format FORMAT;

/*
 * Prototypes
 */
wchar_t compose(wchar_t main, wchar_t modifier);
const char *decode(wchar_t c, FORMAT type);

/*
 * Unicode codes moved to unicode_defs.h avoiding macro name conflicts
 *  JS Aug2010
 */

#endif
