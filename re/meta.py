import struct
P='/tmp/claude-0/-home-user-jogoscolorir/8ea9592c-dd7b-5b7a-8c48-71c068a6ec7b/scratchpad/x/assets/bin/Data/Managed/Metadata/global-metadata.dat'
d=open(P,'rb').read(); H=struct.unpack('<64i',d[:256]); so=H[6]
def S(i):
    e=d.index(b'\0',so+i); return d[so+i:e].decode('utf8','replace')
td_off=H[40]; m_off=H[12]; f_off=H[24]; img_off=H[42]
imgs=[struct.unpack('<10i',d[img_off+i*40:img_off+i*40+40]) for i in range(H[43]//40)]
def typedef(t):
    r=struct.unpack('<22i',d[td_off+t*88:td_off+t*88+88]); c=struct.unpack('<8H',d[td_off+t*88+0x40:td_off+t*88+0x50]); return r,c
def tname(t):
    r,_=typedef(t); ns=S(r[1]); n=S(r[0])
    if r[3]>=0: return tname_by_type_index(r[3])+'/'+n  # declaring type index is type index; approximate
    return (ns+'.' if ns else '')+n
def tname_by_type_index(i): return '?'
def methods_of(t):
    r,c=typedef(t); out=[]
    for i in range(c[0]):
        o=m_off+(r[9]+i)*32; m=struct.unpack('<6i4H',d[o:o+32]); out.append((S(m[0]),m[5],m[6]))  # name, token, flags
    return out
def fields_of(t):
    r,c=typedef(t); return [S(struct.unpack('<3i',d[f_off+(r[8]+i)*12:f_off+(r[8]+i)*12+12])[0]) for i in range(c[2])]
ac=imgs[4]
