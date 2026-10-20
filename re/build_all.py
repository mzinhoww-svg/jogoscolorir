from img import *
import meta,pickle,re
allnames={}  # addr -> name
for im in meta.imgs:
    nm=meta.S(im[0])
    bn=(nm+'\0').encode()
    cands=[]
    for a,e,dd,f in segs:
        for m in re.finditer(re.escape(bn),bytes(dd)):
            if m.start()==0 or dd[m.start()-1]==0: cands.append(a+m.start())
    mod=None
    for c in cands:
        pat=struct.pack('<Q',c)
        for a,e,dd,f in segs:
            bb=bytes(dd); i=bb.find(pat)
            while i!=-1:
                ad=a+i
                if ad%8==0:
                    cnt=u32(ad+8); mp=u64(ad+16)
                    if cnt and mp and cnt<100000 and seg(mp): mod=(ad,cnt,mp); break
                i=bb.find(pat,i+1)
            if mod: break
        if mod: break
    if not mod: print('no module',nm); continue
    ad,cnt,mp=mod
    ptrs=[u64(mp+8*i) for i in range(cnt)]
    for t in range(im[2],im[2]+im[3]):
        r,c=meta.typedef(t); tn=meta.S(r[1]); tn=(tn+'.' if tn else '')+meta.S(r[0])
        for (n,tok,fl) in meta.methods_of(t):
            rid=tok&0xffffff
            if rid and rid-1<cnt and ptrs[rid-1]: allnames.setdefault(ptrs[rid-1],tn+'.'+n)
print(len(allnames))
pickle.dump(allnames,open('/tmp/re/all.pkl','wb'))
