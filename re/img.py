import lief,struct,bisect
SO='/tmp/claude-0/-home-user-jogoscolorir/8ea9592c-dd7b-5b7a-8c48-71c068a6ec7b/scratchpad/x/lib/arm64-v8a/libil2cpp.so'
lief.logging.disable()
b=lief.parse(SO)
segs=[]
for s in b.segments:
    if s.type==lief.ELF.Segment.TYPE.LOAD:
        data=bytearray(bytes(s.content)); data+=b'\0'*(s.virtual_size-len(data)) if s.virtual_size>len(data) else b''
        segs.append((s.virtual_address,s.virtual_address+s.virtual_size,data,int(s.flags)))
segs.sort()
starts=[x[0] for x in segs]
def seg(a):
    i=bisect.bisect_right(starts,a)-1
    if i>=0 and segs[i][0]<=a<segs[i][1]: return segs[i]
def rd(a,n):
    s=seg(a); 
    if not s: return None
    o=a-s[0]; return bytes(s[2][o:o+n])
def u64(a): r=rd(a,8); return struct.unpack('<Q',r)[0] if r and len(r)==8 else None
def u32(a): r=rd(a,4); return struct.unpack('<I',r)[0] if r and len(r)==4 else None
def cstr(a,m=200):
    s=seg(a)
    if not s: return None
    o=a-s[0]; e=s[2].find(b'\0',o,o+m); return bytes(s[2][o:e if e>0 else o+m]).decode('utf8','replace')

for r in b.relocations:
    if str(r.type)=='TYPE.AARCH64_RELATIVE':
        s=seg(r.address)
        if s:
            o=r.address-s[0]; s[2][o:o+8]=struct.pack('<Q',r.addend & 0xffffffffffffffff)
