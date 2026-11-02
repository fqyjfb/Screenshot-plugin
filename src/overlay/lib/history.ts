type HistoryEntry<Data, Diff> =
    | { data: Data; type: "key" }
    | { data: Diff; type: "delta"; parentId: number };

type FullEntry<Data, Diff> = HistoryEntry<Data, Diff> & {
    time: number;
    des: string;
};

// Simplified xhistory from eSearch/src/renderer/lib/history.ts (test code removed)
class xhistory<Data, Diff = any> {
    history: FullEntry<Data, Diff>[];
    private i = -1;
    private tmpData: Data | null = null;
    private tmpDiff: Diff | null = null;
    private des = "";
    private changeEvent = new Set<() => void>();
    private diffFun: (last: Data, now: Data) => Diff | null = (last, now) =>
        last === now ? null : (now as unknown as Diff);
    private applyFun: (data: Data, diff: Diff) => Data = (_, d) =>
        d as unknown as Data;
    private cache: Map<number, Data> = new Map();
    private cacheSize = 30;

    constructor(
        datas: FullEntry<Data, Diff>[],
        _initData: Data,
        op?: {
            diff: (last: Data, now: Data) => Diff | null;
            apply: (data: Data, diff: Diff) => Data;
            cacheSize?: number;
        },
    ) {
        this.history = datas;
        if (this.history.length === 0)
            this.history.unshift({
                des: "0",
                type: "key",
                data: _initData,
                time: Date.now(),
            });
        this.i = this.history.length - 1;
        if (op) {
            this.diffFun = op.diff;
            this.applyFun = op.apply;
            if (op.cacheSize) this.cacheSize = op.cacheSize;
        }
    }

    setDataF(fun: (data: Data) => Data, des?: string) {
        this.tmpData = fun(this.getData());
        if (des) this.des += ` ${des}`;
    }
    setData(data: Data, des?: string) {
        this.tmpData = data;
        if (des) this.des += ` ${des}`;
    }
    setDiff(diff: Diff, des?: string) {
        this.tmpDiff = diff;
        if (des) this.des += ` ${des}`;
    }

    apply(des = this.des) {
        let diff = this.tmpDiff;
        if (!diff) {
            const data = this.tmpData;
            if (data) {
                const last = this.getDataByI(this.i);
                const _diff = this.diffFun(last, structuredClone(data));
                diff = _diff;
            }
        }
        diff = structuredClone(diff);
        if (diff !== null && diff !== undefined) {
            if (this.i !== this.history.length - 1) {
                const h = this.history[this.i]!;
                this.history.push({ ...h, time: Date.now() });
            }
            this.history.push({
                data: diff,
                type: "delta",
                parentId: this.i,
                time: Date.now(),
                des: des || String(this.history.length),
            });
        }
        this.i = this.history.length - 1;
        this.pushCache(this.i, this.tmpData ?? this.getData());
        this.cleanData();
        for (const f of this.changeEvent) f();
    }

    private pushCache(i: number, data: Data) {
        this.cache.set(i, structuredClone(data));
        for (const k of Array.from(this.cache.keys()).slice(
            0,
            Math.max(0, this.cache.size - this.cacheSize),
        ))
            this.cache.delete(k);
    }
    private cleanData() {
        this.tmpData = null;
        this.tmpDiff = null;
        this.des = "";
    }
    giveup() {
        this.cleanData();
    }

    getDataByI(i: number): Data {
        const h = this.history[i];
        if (!h) return undefined as unknown as Data;
        const data =
            h.type === "key"
                ? h.data
                : (this.cache.get(i) ??
                  this.applyFun(this.getDataByI(h.parentId), h.data));
        return structuredClone(data);
    }

    getData() {
        return this.getDataByI(this.i);
    }
    undo() {
        this.jump(this.i - 1);
    }
    redo() {
        this.jump(this.i + 1);
    }
    jump(i: number) {
        this.i = Math.min(Math.max(i, 0), this.history.length - 1);
    }

    on(_name: "change", fun: () => void) {
        this.changeEvent.add(fun);
    }
    get index() {
        return this.i;
    }
    get list() {
        return this.history.map((i) => i.des);
    }
}

export default xhistory;
