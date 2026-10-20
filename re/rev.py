from img import *
import meta,pickle,capstone,bisect
from capstone import arm64_const as A
M=pickle.load(open('/tmp/re/M.pkl','rb'))
allf=sorted(set(a for v in M.values() for a in v))

ALL=pickle.load(open('/tmp/re/all.pkl','rb'))
byaddr={a:[n] for a,n in ALL.items()}
allf=sorted(set(allf)|set(ALL))
cs=capstone.Cs(capstone.CS_ARCH_ARM64,capstone.CS_MODE_ARM); cs.detail=True
# string literals
import struct as st
slo,sls,sld=meta.H[2],meta.H[3],meta.H[4]
def lit(i):
    ln,idx=st.unpack('<II',meta.d[slo+i*8:slo+i*8+8]); return meta.d[sld+idx:sld+idx+ln].decode('utf8','replace')
def fend(a):
    i=bisect.bisect_right(allf,a); return allf[i] if i<len(allf) else a+0x4000
def decode_slot(addr):
    v=u64(addr)
    if v is None: return None
    t=v>>29 if v>>32==0 else None
    return v
def func(a,maxn=4000):
    code=rd(a,min(fend(a)-a,maxn*4)); out=[]; regs={}
    refs=[]
    for ins in cs.disasm(code,a):
        out.append(ins)
    return out
def analyze(a):
    ins=func(a); regs={}; refs=[]; calls=[]
    for i in ins:
        op=i.mnemonic; o=i.operands
        if op=='adrp': regs[o[0].reg]=o[1].imm; continue
        if op=='add' and len(o)==3 and o[2].type==capstone.arm64.ARM64_OP_IMM and o[1].reg in regs:
            regs[o[0].reg]=regs[o[1].reg]+o[2].imm; refs.append(regs[o[0].reg]); continue
        if op=='ldr' and len(o)==2 and o[1].type==capstone.arm64.ARM64_OP_MEM and o[1].mem.base in regs and o[1].mem.index==0 and o[0].reg==o[1].mem.base or (op=='ldr' and len(o)==2 and o[1].type==capstone.arm64.ARM64_OP_MEM and o[1].mem.base in regs and o[1].mem.index==0):
            refs.append(regs[o[1].mem.base]+o[1].mem.disp)
        if op=='bl': calls.append(o[0].imm)
        if o and o[0].type==capstone.arm64.ARM64_OP_REG and op not in ('str','strb','strh','stp','cmp','cbz','cbnz','tbz','tbnz','b','bl','br','blr','ret','tst'):
            regs.pop(o[0].reg,None)
    return ins,refs,calls

UT={1:'TypeInfo',2:'Type',3:'MethodDef',4:'Field',5:'Str',6:'MethodRef'}
TYPES=0x288ac18; NT=27511; MSPEC=0x204bb20; NMS=62685
nm=meta.H[13]//32
_nlit=meta.H[3]//8
strlits=[lit(i) for i in range(_nlit)]
def tdname(t):
    r,c=meta.typedef(t); ns=meta.S(r[1]); n=meta.S(r[0]); return (ns+'.' if ns else '')+n
def mdname(i):
    if not (0<=i<nm): return '?md%d'%i
    m=struct.unpack('<6i4H',meta.d[meta.m_off+i*32:meta.m_off+i*32+32]); return tdname(m[1])+'.'+meta.S(m[0])
def tyname(i):
    if i>=NT: return '?ty%d'%i
    p=u64(TYPES+8*i); data=u64(p); bits=u32(p+8); et=(bits>>16)&0xff
    if et in (0x11,0x12): return tdname(data)
    return 'T[0x%x:%d]'%(et,data & 0xffffffff)
def msname(i):
    if i>=NMS: return '?ms%d'%i
    md,ci,mi=struct.unpack('<3i',rd(MSPEC+12*i,12)); return mdname(md)+'<>'
def resolve(ref):
    cell=u64(ref)
    if not cell or not seg(cell): return None
    e=u32(cell)
    if e is None or (e>>29) not in UT: return None
    t=e>>29; i=(e&0x1FFFFFFE)>>1
    if t==5: return ('Str',strlits[i]) if i<len(strlits) else None
    if t in (1,2): return (UT[t],tyname(i))
    if t==3: return ('M',mdname(i))
    if t==6: return ('M',msname(i))
    if t==4: return ('Field',i)
def uses(name,k=0):
    a=M[name][k]; ins,refs,calls=analyze(a); out=[]
    for r in refs:
        x=resolve(r)
        if x and x not in out: out.append(x)
    return out,[byaddr[c][0] for c in calls if c in byaddr]

def report(name,k=None,follow=True):
    ks=[name] if name in M else []
    if follow:
        base=name.split('.')[0]; meth=name.split('.',1)[1]
        for kk in M:
            if kk.endswith('.MoveNext') and kk.startswith('<'+meth+'>d__'): 
                pass
    res=[]
    addrs=M.get(name,[])
    for a in addrs:
        ins,refs,calls=analyze(a); out=[]
        for r in refs:
            x=resolve(r)
            if x and x not in out: out.append(x)
        cs_=[]
        for c in calls:
            n=byaddr.get(c,[None])[0]
            if n and n not in cs_: cs_.append(n)
        res.append((hex(a),len(ins),out,cs_))
    return res

def ordered(name,k=0,cap=60000):
    a=M[name][k]; code=rd(a,min(fend(a)-a,cap*4)); regs={}; seq=[]
    for i in cs.disasm(code,a):
        op=i.mnemonic; o=i.operands
        if op=='adrp': regs[o[0].reg]=o[1].imm; continue
        if op=='add' and len(o)==3 and o[2].type==capstone.arm64.ARM64_OP_IMM and o[1].reg in regs:
            regs[o[0].reg]=regs[o[1].reg]+o[2].imm; x=resolve(regs[o[0].reg]); 
            if x: seq.append(('R',)+x)
            continue
        if op=='ldr' and len(o)==2 and o[1].type==capstone.arm64.ARM64_OP_MEM and o[1].mem.base in regs and o[1].mem.index==0:
            x=resolve(regs[o[1].mem.base]+o[1].mem.disp)
            if x: seq.append(('R',)+x)
        if op=='bl':
            n=byaddr.get(o[0].imm,['%x'%o[0].imm])[0]; seq.append(('C',n))
        if o and o[0].type==capstone.arm64.ARM64_OP_REG and op not in ('str','strb','strh','stp','cmp','cbz','cbnz','tbz','tbnz','b','bl','br','blr','ret','tst'):
            regs.pop(o[0].reg,None)
    return seq

def callsites(target_name,back=14):
    tgt=[a for a,n in byaddr.items() if n[0]==target_name]
    res=[]
    for name,addrs in M.items():
        for a in addrs:
            code=rd(a,min(fend(a)-a,60000*4)); prev=[]
            for i in cs.disasm(code,a):
                if i.mnemonic=='bl' and i.operands[0].imm in tgt:
                    imm={}
                    for p in prev[-back:]:
                        if p.mnemonic in('mov','movz') and len(p.operands)==2 and p.operands[1].type==capstone.arm64.ARM64_OP_IMM:
                            imm[p.op_str.split(',')[0]]=p.operands[1].imm
                        if p.mnemonic=='fmov': imm[p.op_str.split(',')[0]]=p.op_str
                    res.append((name,hex(i.address),imm))
                prev.append(i)
    return res
