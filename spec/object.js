var RU = require('../src/index');

describe('OBJECT module:', () => {

        var store;
        beforeEach(() => {
             store = {
                userID: 0,
                prefs: {
                    color: 'red',
                    size: 'large'
                }
            };
        });

    //-----------

    it('copies basic objects', () => {

        //var original = {a:1, b:{c:2, d:3}},
        var original = {a:1, b:2},
            dupe     = RU.clone(original);

        original.b = 999;
        expect(dupe.b).toBe(2);
    });

    it('cloneAndMerge: merges multiple objects', () => {
        var part1   = {a:1, b:{c:2, d:3}},
            part2   = {b:{c:4}, q: 99},
            merged  = RU.cloneAndMerge(part1, part2);

        expect(merged.b.d).toBe(3);
        expect(merged.b.c).toBe(4);
        expect(part1.b.c).toBe(2);
        expect(merged.q).toBe(99);
    });

    //-----------

    it('uses dot-notation strings for lookup', () => {

        var selector = 'prefs.size';
        expect(RU.lookup(store, selector)).toBe('large');
    });

    it('uses function selectors for lookup', () => {

        var selector = state => state.prefs.color;
        expect(RU.lookup(store, selector)).toBe('red');
    });

    //-----------

    it('duplicates & tweaks objects with cloneAndAssign', () => {

        var newStore = RU.cloneAndAssign(store, 'prefs.size', 'small');
        expect(newStore.prefs.size).toBe('small');
        expect(store.prefs.size).toBe('large');
    });

    it('rejects function selectors for cloneAndAssign', () => {

        var selector = state => state.prefs.color,
            newStore,
            result = false;

        try {
            // this throws an error
            newStore = RU.cloneAndAssign(store, selector, 'blue');
            result = true;
        }
        catch(e) {}

        expect(result).toBeFalsy();
    });

    //-----------


});