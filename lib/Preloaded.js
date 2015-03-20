"use strict";

var React               = require('react');
var cloneWithProps      = require('react/lib/cloneWithProps');
var ReactUpdates        = require('react/lib/ReactUpdates');
var emptyFunction       = require('react/lib/emptyFunction');
var prefetchAsyncState  = require('./prefetchAsyncState');
var isAsyncComponent    = require('./isAsyncComponent');

var PreloaderMixin = {

  propTypes: {
    children: React.PropTypes.element.isRequired,
    onAsyncStateFetched: React.PropTypes.func,
    onBeforeUpdate: React.PropTypes.func,
    preloader: React.PropTypes.element,
    alwayUsePreloader: React.PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      onAsyncStateFetched: emptyFunction,
      onBeforeUpdate: emptyFunction,
      onUpdate: emptyFunction
    };
  },

  getInitialState: function() {
    var children = React.Children.only(this.props.children);
    if (this.props.preloader) {
      return {
        rendered: this.props.preloader,
        pending: children
      };
    } else {
      return {
        rendered: children,
        pending: null
      };
    }
  },

  componentWillReceiveProps: function(nextProps) {
    var children = React.Children.only(nextProps.children);
    if (isAsyncComponent(children) &&
        children.type !== this.state.rendered.type) {

      var nextState = {pending: children};

      if (nextProps.preloader && nextProps.alwayUsePreloader) {
        nextState.rendered = nextProps.preloader;
      }

      this.setState(nextState, this.prefetchAsyncState.bind(null, children));

    } else {

      this.setState({
        rendered: children,
        pending: null
      }, this.props.onUpdate);

    }
  },

  componentDidMount: function() {
    if (this.state.pending) {
      this.prefetchAsyncState(this.state.pending);
    }
  },

  /**
   * Get the currently rendered component instance.
   *
   * Do not use it in a real code, this is provided only for testing purposes.
   *
   * @returns {ReactComponent}
   */
  getRendered: function() {
    return this.refs.rendered;
  },

  /**
   * Check if there's update pending.
   *
   * @returns {boolean}
   */
  hasPendingUpdate: function() {
    return this.state.pending !== null;
  },

  /**
   * Prefetch async state for a component and update state.
   *
   * @param {ReactComponent} component
   */
  prefetchAsyncState: function(component) {
    prefetchAsyncState(component, function(err, nextRendered) {
      ReactUpdates.batchedUpdates(function() {
        this.props.onAsyncStateFetched();
        if (this.state.pending === component && this.isMounted()) {
          this.props.onBeforeUpdate();
          this.setState({
            rendered: nextRendered,
            pending: null
          }, this.props.onUpdate);
        }
      }.bind(this));
    }.bind(this));
  }
};

/**
 * Component which wraps another component and prefetches its async state before
 * rendering it.
 */
var Preloaded = React.createClass({

  mixins: [PreloaderMixin],

  render: function() {
    return cloneWithProps(this.state.rendered, {ref: 'rendered'});
  }
});

module.exports = Preloaded;

