module.exports = Mn.CollectionView.extend({
   tagName: 'ul',

   childView: require('views/subsetdsviewitem'),

          initialize: function(){ console.log('BookCollectionView: initialize');
            // this.collection.fetch();
           },
        onRender: function(){ console.log('BookCollectionView: onRender') },
        onShow: function(){ console.log('BookCollectionView: onShow') },
});
