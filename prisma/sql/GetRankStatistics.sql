SELECT MIN("weight"), MAX("weight"), MAX("weight") - MIN("weight") as "range", MAX("iteration") as "iteration"
FROM "MediaRanking";